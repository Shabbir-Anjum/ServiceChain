// Seed 20 real worker accounts from the preserved ghost rows (workers_legacy).
// For each ghost: create a pre-confirmed auth user, record old->new id in
// worker_id_map, and fill a complete worker profile (flips profile_complete=true).
//
// Run AFTER worker-accounts.sql:  node scripts/seed-workers.js
// Idempotent: re-running skips users that already exist.
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Varied defaults so the seeded marketplace looks realistic.
const DAYS_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAYS_ALL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function defaultsFor(i) {
  const rate = [15, 18, 20, 22, 25, 28, 30][i % 7];
  const days = i % 3 === 0 ? DAYS_ALL : DAYS_WEEKDAYS;
  const from = i % 2 === 0 ? "09:00" : "08:00";
  const to = i % 2 === 0 ? "17:00" : "18:00";
  return { hourly_rate: rate, available_days: days, hours_from: from, hours_to: to };
}

async function findUserByEmail(email) {
  // Paginate through users to find an existing one (Admin API has no get-by-email).
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
    page++;
  }
}

(async () => {
  const { data: ghosts, error } = await sb.from("workers_legacy").select("*").order("id");
  if (error) {
    console.error("Cannot read workers_legacy — did you run worker-accounts.sql first?", error.message);
    process.exit(1);
  }
  console.log(`Seeding ${ghosts.length} worker accounts…`);

  let created = 0, reused = 0;
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i];
    const email = `${g.id}@seed.servicechain.local`;
    const password = "ChangeMe-" + g.id + "-2026";

    let user = null;
    const res = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: g.name, role: "worker" },
    });
    if (res.error) {
      if (/already.*regist|exists/i.test(res.error.message)) {
        user = await findUserByEmail(email);
        reused++;
      } else {
        console.error(`  ✗ ${g.id} (${g.name}):`, res.error.message);
        continue;
      }
    } else {
      user = res.data.user;
      created++;
    }
    if (!user) { console.error(`  ✗ ${g.id}: could not resolve user`); continue; }

    // Record id mapping for historical job remap.
    await sb.from("worker_id_map").upsert({ old_id: g.id, new_id: user.id });

    // Fill the complete worker profile (the trigger already made a base row).
    const d = defaultsFor(i);
    const { error: upErr } = await sb
      .from("profiles")
      .update({
        role: "worker",
        wallet: g.wallet,
        job_role: g.role,
        emoji: g.emoji,
        skills: g.skills,
        rating: g.rating,
        jobs_done: g.jobs_done,
        available: g.available,
        location: g.location,
        bio: g.tagline,
        hourly_rate: d.hourly_rate,
        available_days: d.available_days,
        hours_from: d.hours_from,
        hours_to: d.hours_to,
      })
      .eq("id", user.id);
    if (upErr) { console.error(`  ✗ ${g.id} profile:`, upErr.message); continue; }
    console.log(`  ✓ ${g.id} → ${g.name} (${g.role}) ${email}`);
  }

  console.log(`\nDone. created=${created} reused=${reused} total=${ghosts.length}`);
  console.log("Next: run supabase/worker-accounts-finalize.sql in the SQL editor.");
})().catch((e) => { console.error(e); process.exit(1); });
