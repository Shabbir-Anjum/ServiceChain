// POST /api/job/decision — the CLIENT approves or disputes submitted work.
// This is the ONLY endpoint that moves funds. The worker (a different account)
// cannot reach it for their own job: we require client_id === auth.uid().
import { NextResponse } from "next/server";
const { clientDecision } = require("../../../../agent/index.js");
const store = require("../../../../lib/jobstore.js");
import { requireRole } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, decision } = await req.json();
    if (decision !== "approve" && decision !== "dispute") {
      return NextResponse.json({ error: "decision must be 'approve' or 'dispute'" }, { status: 400 });
    }

    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });

    // Only the job's own client (or an admin) may decide.
    if (auth.profile.role !== "admin" && rec.clientId !== auth.user.id) {
      return NextResponse.json({ error: "Only the client who posted this job can approve it." }, { status: 403 });
    }
    if (rec.status !== "proof_submitted") {
      return NextResponse.json({ error: "No submitted proof to decide on." }, { status: 409 });
    }

    const result = await clientDecision(uuid, rec.job, decision, rec.proofText || "");

    await store.update(uuid, {
      status: result.approved ? "paid" : "refunded",
      clientDecisionResult: result.approved ? "approved" : "disputed",
      clientDecidedAt: new Date().toISOString(),
    });
    await store.pushSteps(uuid, result.steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({ uuid, approved: result.approved, settleTx: result.settleTx, proofTx: result.proofTx });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
