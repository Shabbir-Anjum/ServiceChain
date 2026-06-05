// Admin-only worker management.
// GET  -> list all worker profiles (incl. completion status + wallet).
// POST -> invite a new worker: create an auth user + fill their worker profile.
import { NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
const { supabase } = require("../../../../lib/supabase.js"); // service role

export async function GET() {
  const auth = await requireRole("admin");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!supabase) return NextResponse.json({ workers: [] });
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, job_role, emoji, skills, rating, jobs_done, available, location, bio, wallet, hourly_rate, profile_complete")
    .eq("role", "worker")
    .order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Normalize to the display shape the admin UI expects.
  const workers = (data || []).map((w) => ({
    id: w.id, name: w.full_name, role: w.job_role, emoji: w.emoji, skills: w.skills,
    rating: w.rating, jobsDone: w.jobs_done, available: w.available, location: w.location,
    tagline: w.bio, wallet: w.wallet, hourlyRate: w.hourly_rate, complete: w.profile_complete,
  }));
  return NextResponse.json({ workers });
}

export async function POST(req) {
  const auth = await requireRole("admin");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const b = await req.json();
  const { email, name, role, emoji, skills, location, tagline, wallet, rating, hourlyRate } = b;
  if (!email || !name || !role) return NextResponse.json({ error: "email, name and role are required" }, { status: 400 });

  // Create a pre-confirmed auth user for the worker.
  const password = "Invited-" + Math.abs(hashCode(email)) + "-2026";
  const { data: created, error: cErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name, role: "worker" },
  });
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
  const uid = created.user.id;

  const skillsArr = Array.isArray(skills) ? skills : String(skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  // Fill the worker profile (trigger already created the base row).
  const { error: uErr } = await supabase.from("profiles").update({
    role: "worker",
    job_role: role,
    emoji: emoji || "🛠️",
    skills: skillsArr.length ? skillsArr : [role.toLowerCase()],
    rating: rating ? Number(rating) : 5,
    available: true,
    location: location || "—",
    bio: tagline || "",
    wallet: wallet || null,
    hourly_rate: hourlyRate ? Number(hourlyRate) : 20,
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    hours_from: "09:00",
    hours_to: "17:00",
  }).eq("id", uid);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ worker: { id: uid, name, role, email }, tempPassword: password });
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}
