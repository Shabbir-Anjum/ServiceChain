// GET  /api/profile -> the logged-in user's own profile (all fields).
// POST /api/profile -> save worker setup fields for the logged-in user (self only).
import { NextResponse } from "next/server";
import { getAuth } from "../../../lib/auth";

const ALLOWED = [
  "full_name", "wallet", "job_role", "emoji", "skills",
  "hourly_rate", "available_days", "hours_from", "hours_to",
  "bio", "location", "available",
];

const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

export async function GET() {
  const { user, supabase } = await getAuth();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function POST(req) {
  const { user, supabase } = await getAuth();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const patch = {};
  for (const k of ALLOWED) if (body[k] !== undefined) patch[k] = body[k];

  // Validate wallet if provided.
  if (patch.wallet && !WALLET_RE.test(patch.wallet)) {
    return NextResponse.json({ error: "Wallet must be a 0x address (40 hex chars)." }, { status: 400 });
  }
  // Normalize skills to an array.
  if (typeof patch.skills === "string") {
    patch.skills = patch.skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (patch.hourly_rate != null && patch.hourly_rate !== "") patch.hourly_rate = Number(patch.hourly_rate);

  // Update own row only (RLS also enforces id = auth.uid()).
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
