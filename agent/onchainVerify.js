// Verify a proof using Somnia's Agentic L1 — the on-chain LLM Inference Agent.
// Our AgentVerifier contract asks Somnia's LLM agent (validator-run, consensus)
// to judge the proof; we send the request, then wait for the ProofVerdict event.
//
// Falls back to off-chain GPT-4o (verifyProof.js) when not configured / on error,
// so the demo never breaks. Toggle with USE_ONCHAIN_VERIFY=1.
const { ethers, getAgentWallet, provider, txUrl } = require("../lib/somnia");
const { AGENT_VERIFIER_ABI } = require("../lib/abis");
const { toJobId } = require("../lib/contracts");
const { verifyProof } = require("./verifyProof");
require("dotenv").config();

const ADDR = process.env.AGENT_VERIFIER_ADDRESS;
const ENABLED = process.env.USE_ONCHAIN_VERIFY === "1" && !!ADDR;

function available() {
  return ENABLED;
}

/**
 * Ask Somnia's on-chain LLM to verify a proof. Resolves to:
 *   { decision, source:"somnia-onchain", txUrl, raw } on success
 * Throws on timeout/failure (caller falls back).
 */
async function verifyOnChain(jobUuid, job, proofText, { timeoutMs = 25000 } = {}) {
  if (!ADDR) throw new Error("AGENT_VERIFIER_ADDRESS not set");
  const wallet = getAgentWallet();
  const verifier = new ethers.Contract(ADDR, AGENT_VERIFIER_ABI, wallet);
  const jobId = toJobId(jobUuid);

  // Deposit = contract floor reserve + per-agent execution reward × subcommittee.
  // Floor alone passes the require() but runners SKIP the request (reward too low),
  // so the verdict never comes. This is the key to getting validators to respond.
  const reserve = await verifier.getDeposit();
  const PER_AGENT = 70000000000000000n; // 0.07 STT
  const SUBCOMMITTEE = 3n;
  const deposit = reserve + PER_AGENT * SUBCOMMITTEE; // ≈ 0.24 STT

  const summary = (job?.summary || "service job").slice(0, 400);
  const proof = String(proofText || "").slice(0, 800);

  // Fire the request (pays the validator subcommittee enough to actually run).
  const tx = await verifier.verifyProof(jobId, summary, proof, { value: deposit });
  const rcpt = await tx.wait();

  // POLL the contract's stored verdict (robust — avoids event-listener races where
  // the verdict lands before we subscribe). verdictStatus: 1 pending, 2 done, 3 failed.
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [vStatus, answer] = await verifier.getVerdict(jobId);
    const s = Number(vStatus);
    if (s === 2) {
      const a = String(answer).toLowerCase().trim();
      return { decision: a.includes("approve") ? "approved" : "rejected", source: "somnia-onchain", txUrl: txUrl(rcpt.hash), raw: a };
    }
    if (s === 3) throw new Error("on-chain verification failed");
    await new Promise((r) => setTimeout(r, 2000)); // poll every 2s
  }
  throw new Error("on-chain verdict timed out");
}

/**
 * Verify a proof, preferring Somnia's on-chain LLM when enabled, else GPT-4o.
 * Always returns { decision, confidence, reason, source }.
 */
async function verifyProofSmart(jobUuid, job, proofText) {
  if (available()) {
    try {
      const r = await verifyOnChain(jobUuid, job, proofText);
      return {
        decision: r.decision,
        confidence: 0.9,
        reason: "Verified by Somnia's on-chain LLM agent (consensus-validated).",
        source: r.source,
        txUrl: r.txUrl,
      };
    } catch (e) {
      console.warn("[onchainVerify] falling back to GPT-4o:", e.message);
    }
  }
  const v = await verifyProof(job, proofText); // {decision, confidence, reason}
  return { ...v, source: "openai" };
}

module.exports = { available, verifyOnChain, verifyProofSmart };
