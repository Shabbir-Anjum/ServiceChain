// The autonomous agent loop — the centerpiece of the demo.
// Two entry points so the work can be split across UI events:
//   startJob()  : client submits request -> agent parses, matches, locks escrow.
//   settleJob() : worker submits proof   -> agent verifies, releases/refunds, records proof.
//
// Every decision + tx is logged to Supabase (if configured) and returned for the dashboard.
const { parseJob } = require("./parseJob");
const { matchWorker } = require("./matchWorker");
const { verifyProof } = require("./verifyProof");
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
 * Phase A — runs the moment a client funds/submits a job.
 * @param {string} jobUuid - unique id (uuid)
 * @param {string} requestText - client's plain-text request
 * @param {Array} workers - available worker pool
 */
async function startJob(jobUuid, requestText, workers) {
  const steps = [];

  const job = await parseJob(requestText);
  steps.push(await log(jobUuid, "parsed", job));

  const { worker, reason } = await matchWorker(job, workers);
  if (!worker) throw new Error("no worker matched");
  steps.push(await log(jobUuid, "matched", { worker, reason }));

  // The LLM estimates a fair price (job.estimatedBudgetSTT), but on testnet our
  // faucet STT is limited — cap the actually-locked amount so the demo never
  // exceeds the agent wallet balance. ESCROW_AMOUNT_STT overrides the cap.
  const estimated = job.estimatedBudgetSTT || 1;
  const amount = Number(process.env.ESCROW_AMOUNT_STT || 0.01);
  const lock = await lockEscrow(jobUuid, worker.wallet, amount);
  steps.push(await log(jobUuid, "escrow_locked", { estimated, amount, ...lock }));

  return { job, worker, estimated, amount, escrowTx: lock, steps };
}

/**
 * Phase B — runs when the worker submits proof of completion.
 * @param {string} jobUuid
 * @param {object} job - the parsed job from startJob
 * @param {string} proofText - worker's completion evidence (text)
 */
async function settleJob(jobUuid, job, proofText) {
  const steps = [];

  const verdict = await verifyProof(job, proofText);
  steps.push(await log(jobUuid, "verified", verdict));

  let settleTx;
  if (verdict.decision === "approved") {
    settleTx = await releasePayment(jobUuid);
    steps.push(await log(jobUuid, "payment_released", settleTx));
  } else {
    settleTx = await refundClient(jobUuid);
    steps.push(await log(jobUuid, "client_refunded", settleTx));
  }

  const proofTx = await recordProof(jobUuid, proofText, verdict.decision);
  steps.push(await log(jobUuid, "proof_recorded", proofTx));

  return { verdict, settleTx, proofTx, steps };
}

module.exports = { startJob, settleJob, log };
