// GPT-4o: pick the best worker from a candidate pool for a parsed job.
const { askJSON } = require("../lib/openai");

const SYSTEM = `You are a worker-matching agent for a service marketplace.
Given a parsed job and a JSON list of available workers, choose the single best worker.
Weigh: skill/category match, rating, availability, and location proximity.
Return JSON exactly:
{
  "workerId": "<id of chosen worker>",
  "reason": "<one-line justification>"
}`;

/**
 * @param {object} job - parsed job from parseJob()
 * @param {Array} workers - [{id, name, skills, rating, available, location, wallet}]
 */
async function matchWorker(job, workers) {
  const user = `JOB:\n${JSON.stringify(job)}\n\nWORKERS:\n${JSON.stringify(workers)}`;
  const choice = await askJSON(SYSTEM, user);
  const worker = workers.find((w) => String(w.id) === String(choice.workerId));
  return { worker, reason: choice.reason };
}

module.exports = { matchWorker };
