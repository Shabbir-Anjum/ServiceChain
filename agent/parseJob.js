// GPT-4o: turn a free-text client request into structured job data.
const { askJSON } = require("../lib/openai");

const SYSTEM = `You are a service-marketplace intake agent.
Given a client's plain-text request, extract structured fields.
Return JSON exactly:
{
  "category": "<plumbing|electrical|cleaning|delivery|tech|other>",
  "urgency": "<low|medium|high>",
  "location": "<short location string or 'unknown'>",
  "estimatedBudgetSTT": <number, your fair estimate in STT test tokens>,
  "summary": "<one-line job summary>"
}`;

async function parseJob(requestText) {
  const data = await askJSON(SYSTEM, requestText);
  return data;
}

module.exports = { parseJob };
