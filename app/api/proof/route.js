// POST /api/proof — the WORKER submits proof (note + optional photo URL).
// Runs an AI vision pre-check (advisory) and marks the job "awaiting client
// approval". NO funds move here — only the client can release via /api/job/decision.
import { NextResponse } from "next/server";
const { submitProof } = require("../../../agent/index.js");
const store = require("../../../lib/jobstore.js");
import { requireRole } from "../../../lib/auth";

export async function POST(req) {
  try {
    const auth = await requireRole("worker", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, proofText, photoUrl } = await req.json();
    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (!rec.job) return NextResponse.json({ error: "job not started" }, { status: 400 });

    if (auth.profile.role === "worker" && rec.workerId !== auth.profile.id) {
      return NextResponse.json({ error: "This job is not assigned to you." }, { status: 403 });
    }
    if (rec.status !== "escrow_locked" && rec.status !== "proof_submitted") {
      return NextResponse.json({ error: "Job is not ready for proof." }, { status: 409 });
    }

    const { ai, steps } = await submitProof(uuid, rec.job, proofText, photoUrl || null);

    await store.update(uuid, {
      status: "proof_submitted",
      proofText: proofText || null,
      proofPhotoUrl: photoUrl || null,
      aiCheck: ai,
      proofSubmittedAt: new Date().toISOString(),
    });
    await store.pushSteps(uuid, steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({ uuid, status: "proof_submitted", ai });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
