// GPT-4o vision: an ADVISORY pre-check of the worker's proof photo against the
// job. This NEVER releases funds — it only gives the client a signal. The client
// is the source of truth and makes the final approve/dispute decision.
const { askJSON, askVisionJSON } = require("../lib/openai");

const SYSTEM = `You are a proof-of-work pre-screening assistant for a service marketplace.
A worker submitted evidence that a job is complete. You ASSIST a human client — you do NOT make the final decision.
Given the job and the worker's photo (and note), assess whether the image plausibly shows the described work done.
Be honest and cautious: note if the photo looks generic, unrelated, reused/stock, low-effort, or doesn't show the claimed result.
Return JSON exactly:
{
  "looksConsistent": <true|false>,        // does the photo plausibly match the job?
  "confidence": <0-1 number>,
  "notes": "<one or two short sentences the client can read — what you see and any concerns>"
}`;

const TEXT_ONLY_SYSTEM = `You are a proof-of-work pre-screening assistant. A worker submitted a TEXT-ONLY note (no photo) claiming a job is done. You ASSIST a human client; you do NOT decide.
Assess whether the note is specific and plausible. Flag vagueness or lack of detail. Return JSON exactly:
{ "looksConsistent": <true|false>, "confidence": <0-1 number>, "notes": "<short note; mention that no photo was provided>" }`;

/**
 * @param {object} job - parsed job
 * @param {string} proofText - worker's note
 * @param {string|null} photoUrl - public image URL, or null
 * @returns {{looksConsistent, confidence, notes, hadPhoto}}
 */
async function visionCheck(job, proofText, photoUrl) {
  try {
    if (photoUrl) {
      const text = `JOB:\n${JSON.stringify(job)}\n\nWORKER'S NOTE:\n${proofText || "(none)"}\n\nThe attached image is the worker's proof photo. Does it plausibly show this job completed?`;
      const r = await askVisionJSON(SYSTEM, text, photoUrl);
      return { looksConsistent: !!r.looksConsistent, confidence: Number(r.confidence) || 0, notes: String(r.notes || ""), hadPhoto: true };
    }
    const r = await askJSON(TEXT_ONLY_SYSTEM, `JOB:\n${JSON.stringify(job)}\n\nWORKER'S NOTE (no photo):\n${proofText || "(none)"}`);
    return { looksConsistent: !!r.looksConsistent, confidence: Number(r.confidence) || 0, notes: String(r.notes || ""), hadPhoto: false };
  } catch (e) {
    // Vision is advisory — never block the flow if it errors.
    return { looksConsistent: null, confidence: 0, notes: "AI pre-check unavailable.", hadPhoto: !!photoUrl, error: String(e.message || e) };
  }
}

module.exports = { visionCheck };
