// The autonomous agent loop — the centerpiece of the demo.
// Two entry points so the work can be split across UI events:
//   startJob()  : client submits request -> agent parses, matches, locks escrow.
//   settleJob() : worker submits proof   -> agent verifies, releases/refunds, records proof.
//
// Every decision + tx is logged to Supabase (if configured) and returned for the dashboard.
const { parseJob } = require("./parseJob");
const { recommendWorkers } = require("./recommend");
const { visionCheck } = require("./visionCheck");
const { available: onchainAvailable, verifyProofSmart } = require("./onchainVerify");
const { sendJobEmail } = require("./notify");
const { lockEscrow, releasePayment, refundClient, recordProof, verifyDeposit } = require("./executor");
const { txUrl } = require("../lib/somnia");
const { supabase } = require("../lib/supabase");

async function log(jobUuid, step, payload) {
  const entry = { job_uuid: jobUuid, step, payload, created_at: new Date().toISOString() };
  if (supabase) {
    await supabase.from("agent_logs").insert(entry);
  }
  console.log(`[agent ${jobUuid}] ${step}:`, JSON.stringify(payload));
  return entry;
}

/**
 * Phase A1 — runs when a client posts a job. Parse + RECOMMEND (no escrow yet).
 * @param {string} jobUuid
 * @param {string} requestText - client's plain-text request
 * @param {Array} workers - available worker pool (incl. wallet + email)
 */
async function recommendJob(jobUuid, requestText, workers) {
  const steps = [];

  const job = await parseJob(requestText);
  steps.push(await log(jobUuid, "parsed", job));

  const { primary, alternative } = await recommendWorkers(job, workers);
  if (!primary) throw new Error("no worker could be recommended");
  steps.push(await log(jobUuid, "recommended", {
    primary: { id: primary.id, name: primary.name, why: primary.why, quotedPrice: primary.quotedPrice },
    alternative: alternative ? { id: alternative.id, name: alternative.name, quotedPrice: alternative.quotedPrice } : null,
  }));

  return { job, primary, alternative, steps };
}

/**
 * Phase A2 — runs when the client CONFIRMS a worker. Escrow must be FUNDED, then
 * email the worker. Funding comes either from:
 *   - the CLIENT's own wallet (MetaMask) — pass meta.prefundedTx; we VERIFY it on-chain.
 *   - the AGENT wallet (demo fallback) — no prefundedTx; we call deposit() ourselves.
 * @param {string} jobUuid
 * @param {object} job - parsed job
 * @param {object} worker - chosen worker (wallet, email, quotedPrice, role)
 * @param {object} meta - { clientName, fullRequestText, nowIso, prefundedTx?, payerAddress? }
 */
async function confirmJob(jobUuid, job, worker, meta = {}) {
  const steps = [];

  const estimated = worker.quotedPrice || job.estimatedBudgetSTT || 1;
  const amount = Number(process.env.ESCROW_AMOUNT_STT || 0.01);

  let lock;
  if (meta.prefundedTx) {
    // CLIENT already paid from their wallet — verify the deposit is real on-chain.
    const v = await verifyDeposit(jobUuid, worker.wallet);
    if (!v.ok) throw new Error("Could not verify your escrow payment on-chain.");
    lock = { hash: meta.prefundedTx, url: txUrl(meta.prefundedTx), paidBy: "client" };
    steps.push(await log(jobUuid, "escrow_locked", { estimated, amount, worker: worker.name, paidBy: "client", ...lock }));
  } else {
    // FALLBACK: agent funds the escrow (demo, hands-off).
    lock = { ...(await lockEscrow(jobUuid, worker.wallet, amount)), paidBy: "agent" };
    steps.push(await log(jobUuid, "escrow_locked", { estimated, amount, worker: worker.name, paidBy: "agent", ...lock }));
  }

  // Notify the hired worker by email via the n8n webhook (best-effort).
  let email = { ok: false, skipped: true };
  if (worker.email) {
    email = await sendJobEmail({
      jobId: jobUuid,
      worker: { name: worker.name, email: worker.email, role: worker.role },
      clientName: meta.clientName || "A client",
      job: {
        summary: job.summary,
        category: job.category,
        urgency: job.urgency,
        location: job.location,
        fullRequestText: meta.fullRequestText || job.summary,
      },
      quotedPrice: worker.quotedPrice ?? estimated,
      escrow: { amountSTT: amount, txUrl: lock.url },
      nowIso: meta.nowIso || "",
    });
    steps.push(await log(jobUuid, "worker_emailed", { to: worker.email, ok: email.ok, status: email.status || null }));
  }

  return { estimated, amount, escrowTx: lock, email, steps };
}

/**
 * Phase B1 — the WORKER submits proof (photo + note). NO funds move here.
 * Runs an AI vision pre-check (advisory only) and records the submission.
 * @param {string} jobUuid
 * @param {object} job - parsed job
 * @param {string} proofText - worker's note
 * @param {string|null} photoUrl - public proof image URL (or null)
 */
async function submitProof(jobUuid, job, proofText, photoUrl) {
  const steps = [];
  steps.push(await log(jobUuid, "proof_submitted", { hasPhoto: !!photoUrl, note: proofText }));

  // Photo screening via GPT-4o vision (Somnia's LLM is text-only).
  const ai = await visionCheck(job, proofText, photoUrl);
  steps.push(await log(jobUuid, "ai_prechecked", ai));

  // Text verdict via Somnia's ON-CHAIN LLM agent (consensus-validated) when
  // enabled — this is the agent-native, on-chain AI check. Falls back to GPT-4o.
  let onchain = null;
  if (onchainAvailable()) {
    try {
      const r = await verifyProofSmart(jobUuid, job, proofText);
      onchain = { decision: r.decision, source: r.source, txUrl: r.txUrl || null };
      steps.push(await log(jobUuid, "onchain_verified", onchain));
    } catch (e) {
      // advisory only — never block submission
    }
  }

  return { ai, onchain, steps };
}

/**
 * Phase B2 — the CLIENT decides. This is the ONLY path that moves funds.
 * approve -> release payment to worker; dispute -> refund client. Then record proof.
 * @param {string} jobUuid
 * @param {object} job - parsed job
 * @param {('approve'|'dispute')} decision
 * @param {string} proofText - the worker's note (for the on-chain proof hash)
 * @param {string|null} disputeReason - why the client disputed (recorded on dispute)
 */
async function clientDecision(jobUuid, job, decision, proofText, disputeReason) {
  const steps = [];
  const approved = decision === "approve";

  let settleTx;
  if (approved) {
    settleTx = await releasePayment(jobUuid);
    steps.push(await log(jobUuid, "payment_released", settleTx));
  } else {
    settleTx = await refundClient(jobUuid);
    steps.push(await log(jobUuid, "client_refunded", { ...settleTx, reason: disputeReason || "" }));
  }

  // Record proof on-chain; for a dispute, hash the worker's note + the reason so
  // the dispute is part of the immutable record.
  const proofPayload = approved ? (proofText || "") : `${proofText || ""}\n[DISPUTE] ${disputeReason || ""}`;
  const proofTx = await recordProof(jobUuid, proofPayload, approved ? "approved" : "disputed");
  steps.push(await log(jobUuid, "proof_recorded", proofTx));

  return { approved, settleTx, proofTx, disputeReason: approved ? null : disputeReason, steps };
}

module.exports = { recommendJob, confirmJob, submitProof, clientDecision, log };
