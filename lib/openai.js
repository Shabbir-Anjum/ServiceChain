// OpenAI client + a helper that forces JSON-shaped responses.
const OpenAI = require("openai");
require("dotenv").config();

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Lazy init — don't throw on import when the key isn't set yet.
let _client = null;
function client() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing in .env");
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * Ask GPT-4o and get back parsed JSON.
 * @param {string} system - system prompt
 * @param {string} user - user content
 * @returns {Promise<object>}
 */
async function askJSON(system, user) {
  const res = await client().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return JSON.parse(res.choices[0].message.content);
}

/**
 * Ask GPT-4o vision about an image (by URL) and get back parsed JSON.
 * @param {string} system - system prompt
 * @param {string} text - the text part of the user turn
 * @param {string} imageUrl - publicly reachable image URL
 * @returns {Promise<object>}
 */
async function askVisionJSON(system, text, imageUrl) {
  const res = await client().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });
  return JSON.parse(res.choices[0].message.content);
}

module.exports = { client, askJSON, askVisionJSON, MODEL };
// `client` is a function — call client() to get the OpenAI instance.
