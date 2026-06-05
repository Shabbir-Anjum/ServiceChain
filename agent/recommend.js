// GPT-4o: recommend 1-2 workers for a parsed job, ranked by fit + value.
// Returns a PRIMARY pick and an optional cheaper ALTERNATIVE, each rehydrated
// into the full worker object (so downstream negotiate/email have everything,
// incl. email + wallet) plus a persuasive pitch, highlights, and a quote.
const { askJSON } = require("../lib/openai");

const SYSTEM = `You are ServiceChain's worker-matching agent. Given a parsed job and a pool of workers, recommend the best worker(s) for the client. Return STRICT JSON only — no prose, no markdown, no code fences.

SELECTION RULES
- Rank candidates by FIT and VALUE.
  - FIT: worker skills/role match the job category; bonus if the location matches and they are available.
  - VALUE: high rating and many jobsDone relative to hourlyRate. A great rating at a fair price beats a slightly higher rating at a much higher price.
- Hard preference order: available > unavailable, location match > no match, higher rating > lower, more jobsDone > fewer, lower hourlyRate > higher (when fit is comparable).
- Never recommend a worker whose skills are clearly unrelated to the job category.

PRIMARY
- Pick exactly ONE primary: the best overall fit-and-value worker. Prefer one who is available and, when possible, in the job's location.

ALTERNATIVE
- Include ONE alternative ONLY IF a different worker is meaningfully cheaper (lower quotedPrice) AND still a decent fit (relevant skills, rating >= 4.3). The alternative's quotedPrice MUST be lower than the primary's.
- If no such worker exists, set "alternative" to null. Do not invent or pad.
- Never repeat the primary worker as the alternative.

PITCH WRITING
- "why": ONE persuasive line (<= 140 chars). State the single strongest reason this worker fits THIS job. For the alternative, lead with the cheaper-value angle.
- "highlights": 2-3 SHORT attraction tokens drawn from real data. Format ratings/jobs as "4.9★ · 211 jobs". Other examples: "specializes in plumbing", "available today", "based in Lahore". No sentences.
- Do not fabricate any number; use only values present in the worker objects.

QUOTING
- "quotedPrice" is a fair STT quote for THIS job, not an hourly rate. Estimate effort from the job's urgency and category, multiply by hourlyRate, and keep it close to estimatedBudgetSTT when that is provided. Round to 2 decimals. This quote is independent of the on-chain escrow amount.

OUTPUT SHAPE (return exactly this shape)
{"primary":{"workerId":"","why":"","highlights":[""],"quotedPrice":0},"alternative":{"workerId":"","why":"","highlights":[""],"quotedPrice":0}}
Set "alternative" to null when not applicable. workerId must exactly match an id from the pool. Return JSON only.`;

/**
 * @param {object} job - parsed job
 * @param {Array} workers - full pool [{id,name,role,emoji,skills,rating,jobsDone,available,location,tagline,hourlyRate,wallet,email}]
 * @returns {{ primary: object|null, alternative: object|null, raw: object }}
 */
async function recommendWorkers(job, workers) {
  // Slim the pool for the prompt (drop wallet/email — rejoined by id after).
  const slim = workers.map((w) => ({
    id: w.id, name: w.name, role: w.role, skills: w.skills, rating: w.rating,
    jobsDone: w.jobsDone, available: w.available, location: w.location,
    tagline: w.tagline, hourlyRate: w.hourlyRate,
  }));
  const user = `JOB:\n${JSON.stringify(job)}\n\nWORKERS:\n${JSON.stringify(slim)}`;
  const raw = await askJSON(SYSTEM, user);

  const byId = Object.fromEntries(workers.map((w) => [String(w.id), w]));
  // Rehydrate: merge the pitch fields onto the full worker object (incl. email/wallet).
  const hydrate = (rec) => {
    if (!rec || !rec.workerId) return null;
    const w = byId[String(rec.workerId)];
    if (!w) return null;
    return { ...w, why: rec.why, highlights: rec.highlights || [], quotedPrice: rec.quotedPrice };
  };

  let primary = hydrate(raw.primary);
  let alternative = hydrate(raw.alternative);
  // Guard: never the same worker; alternative must be cheaper.
  if (alternative && primary && alternative.id === primary.id) alternative = null;
  if (alternative && primary && alternative.quotedPrice >= primary.quotedPrice) alternative = null;
  // Fallback: if the model returned nothing usable, pick the top-rated available worker.
  if (!primary) {
    const sorted = [...workers].filter((w) => w.available).sort((a, b) => b.rating - a.rating);
    const w = sorted[0] || workers[0];
    if (w) primary = { ...w, why: `Top-rated ${w.role} for your job`, highlights: [`${w.rating}★ · ${w.jobsDone} jobs`], quotedPrice: w.hourlyRate || job.estimatedBudgetSTT || 1 };
  }
  return { primary, alternative, raw };
}

module.exports = { recommendWorkers };
