// GET /api/status        -> jobs the logged-in user may see (role-scoped)
// GET /api/status?uuid=.. -> one job, if the user is allowed to see it
import { NextResponse } from "next/server";
const store = require("../../../lib/jobstore.js");
import { getAuth } from "../../../lib/auth";

function canSee(rec, profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role === "worker") return rec.workerId === profile.id; // worker_id = auth uid
  return rec.clientId === profile.id; // client
}

export async function GET(req) {
  const { profile } = await getAuth();
  if (!profile) return NextResponse.json({ jobs: [], role: null });

  const uuid = new URL(req.url).searchParams.get("uuid");
  if (uuid) {
    const rec = await store.get(uuid);
    if (!rec || !canSee(rec, profile)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(rec);
  }

  const jobs = await store.forUser({
    role: profile.role,
    userId: profile.id,
    workerId: profile.id, // a worker's jobs are worker_id = their own auth uid
  });
  return NextResponse.json({ jobs, role: profile.role });
}
