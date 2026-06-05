// Loads the matchable worker pool from the DB using the SERVICE ROLE client
// (it can read wallet + email, which anon cannot). Only complete + available
// workers are matchable. Falls back to the seed file if the DB is down.
const { supabase: svc } = require("./supabase.js");
const { WORKERS } = require("../app/workers.js");

async function loadPool() {
  if (svc) {
    try {
      const { data } = await svc
        .from("profiles")
        .select("id, full_name, job_role, emoji, skills, rating, jobs_done, available, location, bio, wallet, email, hourly_rate")
        .eq("role", "worker")
        .eq("profile_complete", true)
        .eq("available", true);
      if (data && data.length) {
        return data.map((w) => ({
          id: w.id, name: w.full_name, role: w.job_role, emoji: w.emoji,
          skills: w.skills, rating: w.rating, jobsDone: w.jobs_done,
          available: w.available, location: w.location, tagline: w.bio,
          wallet: w.wallet, email: w.email, hourlyRate: w.hourly_rate,
        }));
      }
    } catch { /* fall through to seed */ }
  }
  return WORKERS.map((w) => ({ ...w, hourlyRate: w.hourlyRate || 20, email: w.email || null }));
}

// Re-fetch a single worker by id (the confirm step rehydrates wallet/email).
async function workerById(id) {
  const pool = await loadPool();
  return pool.find((w) => String(w.id) === String(id)) || null;
}

module.exports = { loadPool, workerById };
