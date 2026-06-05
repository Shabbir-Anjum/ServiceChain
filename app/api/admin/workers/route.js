// Admin-only worker management.
// GET  -> list all workers (incl. wallet, admin sees full).
// POST -> create a new worker in the marketplace.
import { NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
const { supabase } = require("../../../../lib/supabase.js"); // service role for writes

export async function GET() {
  const auth = await requireRole("admin");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!supabase) return NextResponse.json({ workers: [] });
  const { data, error } = await supabase.from("workers").select("*").order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workers: data });
}

export async function POST(req) {
  const auth = await requireRole("admin");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = await req.json();
  const { name, role, emoji, skills, location, tagline, wallet, rating } = body;
  if (!name || !role) return NextResponse.json({ error: "name and role are required" }, { status: 400 });

  // Generate next id (w<N>).
  const { data: existing } = await supabase.from("workers").select("id");
  const maxN = (existing || []).reduce((m, r) => {
    const n = parseInt(String(r.id).replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  const id = "w" + (maxN + 1);

  const skillsArr = Array.isArray(skills)
    ? skills
    : String(skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  const row = {
    id,
    name,
    role,
    emoji: emoji || "🛠️",
    skills: skillsArr.length ? skillsArr : [role.toLowerCase()],
    rating: rating ? Number(rating) : 5,
    jobs_done: 0,
    available: true,
    location: location || "—",
    tagline: tagline || "",
    wallet: wallet || "0x000000000000000000000000000000000000dEaD",
  };
  const { data, error } = await supabase.from("workers").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ worker: data });
}
