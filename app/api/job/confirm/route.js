// POST /api/job/confirm — two modes:
//  1) { uuid, workerId, mode:"prepare" }  -> returns { workerWallet, amountStt, jobUuid }
//        so the CLIENT can sign the escrow deposit() from their own MetaMask.
//        (workerWallet is a public RECEIVING address — safe to expose; not a secret.)
//  2) { uuid, workerId, quotedPrice, prefundedTx? } -> finalize:
//        - prefundedTx present  -> client already paid; we VERIFY on-chain + email worker.
//        - prefundedTx absent   -> AGENT funds the escrow (demo fallback) + email worker.
import { NextResponse } from "next/server";
const { confirmJob } = require("../../../../agent/index.js");
const { workerById } = require("../../../../lib/pool.js");
const store = require("../../../../lib/jobstore.js");
import { requireRole } from "../../../../lib/auth";

const AMOUNT_STT = Number(process.env.ESCROW_AMOUNT_STT || 0.01);

export async function POST(req) {
  try {
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, workerId, quotedPrice, mode, prefundedTx } = await req.json();
    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (rec.clientId && rec.clientId !== auth.user.id && auth.profile.role !== "admin") {
      return NextResponse.json({ error: "not your job" }, { status: 403 });
    }

    const worker = await workerById(workerId);
    if (!worker) return NextResponse.json({ error: "worker not found" }, { status: 404 });

    // ── Mode 1: prepare — give the client what they need to sign the deposit. ──
    if (mode === "prepare") {
      return NextResponse.json({
        jobUuid: uuid,
        workerWallet: worker.wallet, // public receiving address
        amountStt: AMOUNT_STT,
      });
    }

    // ── Mode 2: finalize (verify client tx, or agent-fund fallback). ──
    if (rec.status === "escrow_locked" || rec.status === "paid" || rec.status === "refunded") {
      return NextResponse.json({ error: "Job already confirmed." }, { status: 409 });
    }
    if (quotedPrice != null) worker.quotedPrice = quotedPrice;

    const result = await confirmJob(uuid, rec.job, worker, {
      clientName: auth.profile.full_name || "A client",
      fullRequestText: rec.requestText,
      nowIso: new Date().toISOString(),
      prefundedTx: prefundedTx || null,
      payerAddress: auth.user.id,
    });

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
      amount: result.amount,
      quotedPrice: worker.quotedPrice,
      paidBy: result.escrowTx?.paidBy || "agent",
      escrowTx: result.escrowTx,
      emailed: result.email?.ok || false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
