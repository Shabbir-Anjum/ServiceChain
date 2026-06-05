// The autonomous agent loop — the centerpiece of the demo.
// Two entry points so the work can be split across UI events:
//   startJob()  : client submits request -> agent parses, matches, locks escrow.
//   settleJob() : worker submits proof   -> agent verifies, releases/refunds, records proof.
//
// Every decision + tx is logged to Supabase (if configured) and returned for the dashboard.
const { parseJob } = require("./parseJob");
const { recommendWorkers } = require("./recommend");
const { visionCheck } = require("./visionCheck");
const { sendJobEmail } = require("./notify");
const { lockEscrow, releasePayment, refundClient, recordProof } = require("./executor");
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
 * Phase A2 — runs when the client CONFIRMS a worker. Lock escrow + email worker.
 * @param {string} jobUuid
 * @param {object} job - parsed job
 * @param {object} worker - the chosen worker (full object: wallet, email, quotedPrice, role)
 * @param {object} meta - { clientName, fullRequestText }
 */
async function confirmJob(jobUuid, job, worker, meta = {}) {
  const steps = [];

  // The LLM estimates a fair price, but testnet STT is limited — cap the locked
  // amount so the demo never exceeds the agent wallet. ESCROW_AMOUNT_STT overrides.
  const estimated = worker.quotedPrice || job.estimatedBudgetSTT || 1;
  const amount = Number(process.env.ESCROW_AMOUNT_STT || 0.01);
  const lock = await lockEscrow(jobUuid, worker.wallet, amount);
  steps.push(await log(jobUuid, "escrow_locked", { estimated, amount, worker: worker.name, ...lock }));

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
  const ai = await visionCheck(job, proofText, photoUrl);
  steps.push(await log(jobUuid, "proof_submitted", { hasPhoto: !!photoUrl, note: proofText }));
  steps.push(await log(jobUuid, "ai_prechecked", ai));
  return { ai, steps };
}

/**
 * Phase B2 — the CLIENT decides. This is the ONLY path that moves funds.
 * approve -> release payment to worker; dispute -> refund client. Then record proof.
 * @param {string} jobUuid
 * @param {object} job - parsed job
 * @param {('approve'|'dispute')} decision
 * @param {string} proofText - the worker's note (for the on-chain proof hash)
 */
async function clientDecision(jobUuid, job, decision, proofText) {
  const steps = [];
  const approved = decision === "approve";

  let settleTx;
  if (approved) {
    settleTx = await releasePayment(jobUuid);
    steps.push(await log(jobUuid, "payment_released", settleTx));
  } else {
    settleTx = await refundClient(jobUuid);
    steps.push(await log(jobUuid, "client_refunded", settleTx));
  }

  const proofTx = await recordProof(jobUuid, proofText || "", approved ? "approved" : "disputed");
  steps.push(await log(jobUuid, "proof_recorded", proofTx));

  return { approved, settleTx, proofTx, steps };
}

module.exports = { recommendJob, confirmJob, submitProof, clientDecision, log };
