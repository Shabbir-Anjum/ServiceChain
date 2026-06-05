// GET /api/workers -> the available worker pool (for the marketplace UI).
// Reads from Supabase when reachable; otherwise falls back to the seed file.
import { NextResponse } from "next/server";
const { WORKERS } = require("../../workers.js");
const { supabase } = require("../../../lib/supabase.js");

// Never leak wallet keys to the client; expose only display fields.
const display = (w) => ({
  id: w.id,
  name: w.name,
  role: w.role,
  emoji: w.emoji,
  skills: w.skills,
  rating: w.rating,
  jobsDone: w.jobsDone ?? w.jobs_done,
  available: w.available,
  location: w.location,
  tagline: w.tagline,
});

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("workers").select("*").order("rating", { ascending: false });
      if (!error && data && data.length) {
        return NextResponse.json({ workers: data.map(display), source: "db" });
      }
    } catch {
      /* fall through to seed */
    }
  }
  return NextResponse.json({ workers: WORKERS.map(display), source: "seed" });
}
