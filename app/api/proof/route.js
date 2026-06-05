// POST /api/proof — worker submits proof. Agent verifies, releases/refunds, records proof.
// Only the worker assigned to the job (or an admin) may submit its proof.
import { NextResponse } from "next/server";
const { settleJob } = require("../../../agent/index.js");
const store = require("../../../lib/jobstore.js");
import { requireRole } from "../../../lib/auth";

export async function POST(req) {
  try {
    const auth = await requireRole("worker", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, proofText } = await req.json();
    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (!rec.job) return NextResponse.json({ error: "job not started" }, { status: 400 });

    // Workers may only settle jobs assigned to them (worker_id = their auth uid).
    if (auth.profile.role === "worker" && rec.workerId !== auth.profile.id) {
      return NextResponse.json({ error: "This job is not assigned to you." }, { status: 403 });
    }
    if (rec.status === "paid" || rec.status === "refunded") {
      return NextResponse.json({ error: "Job already settled." }, { status: 409 });
    }

    // Agent autonomously: verify -> release or refund -> record proof on-chain.
    const result = await settleJob(uuid, rec.job, proofText);
    await store.update(uuid, {
      status: result.verdict.decision === "approved" ? "paid" : "refunded",
    });
    await store.pushSteps(uuid, result.steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({ uuid, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
