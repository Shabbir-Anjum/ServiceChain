// POST /api/job/confirm — client confirms a worker. Lock escrow on-chain + email
// the hired worker via the n8n webhook. The worker (wallet/email) is re-derived
// server-side from the id so secrets never travel through the browser.
import { NextResponse } from "next/server";
const { confirmJob } = require("../../../../agent/index.js");
const { workerById } = require("../../../../lib/pool.js");
const store = require("../../../../lib/jobstore.js");
import { requireRole } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, workerId, quotedPrice } = await req.json();
    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (rec.clientId && rec.clientId !== auth.user.id && auth.profile.role !== "admin") {
      return NextResponse.json({ error: "not your job" }, { status: 403 });
    }
    if (rec.status === "escrow_locked" || rec.status === "paid" || rec.status === "refunded") {
      return NextResponse.json({ error: "Job already confirmed." }, { status: 409 });
    }

    const worker = await workerById(workerId);
    if (!worker) return NextResponse.json({ error: "worker not found" }, { status: 404 });
    if (quotedPrice != null) worker.quotedPrice = quotedPrice;

    const result = await confirmJob(uuid, rec.job, worker, {
      clientName: auth.profile.full_name || "A client",
      fullRequestText: rec.requestText,
      nowIso: new Date().toISOString(),
    });

    // Persist the chosen worker + escrow on the job.
    const { wallet, email, ...workerSnapshot } = worker;
    await store.update(uuid, {
      worker: workerSnapshot,
      workerId: worker.id,
      estimated: result.estimated,
      amount: result.amount,
      status: "escrow_locked",
    });
    await store.pushSteps(uuid, result.steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({
      uuid,
      worker: workerSnapshot,
      amount: result.amount,            // internal STT escrow amount
      quotedPrice: worker.quotedPrice,  // USD quote shown to the client
      escrowTx: result.escrowTx,
      emailed: result.email?.ok || false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
