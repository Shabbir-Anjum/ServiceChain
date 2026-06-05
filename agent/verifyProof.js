// GPT-4o: evaluate a worker's text proof of completion -> approve or reject.
const { askJSON } = require("../lib/openai");

const SYSTEM = `You are a job-completion verification agent.
Given the original job and the worker's submitted proof (text describing what was done),
decide if the job appears genuinely completed.
Be reasonable but skeptical of vague/empty proofs.
Return JSON exactly:
{
  "decision": "<approved|rejected>",
  "confidence": <0-1 number>,
  "reason": "<one-line justification>"
}`;

/**
 * @param {object} job - parsed job
 * @param {string} proofText - worker's description of completed work
 */
async function verifyProof(job, proofText) {
  const user = `JOB:\n${JSON.stringify(job)}\n\nPROOF SUBMITTED BY WORKER:\n${proofText}`;
  return await askJSON(SYSTEM, user);
}

module.exports = { verifyProof };
