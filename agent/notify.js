// Posts the hired-worker email payload to the n8n webhook.
// User-controlled strings are HTML-escaped at build time so the email template
// (which interpolates them raw) can't be broken or injected.

const WEBHOOK = process.env.JOB_EMAIL_WEBHOOK || "https://workflows.automaxion.agency/webhook/send_job_email";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build + send the job-assignment email to the hired worker.
 * @param {object} p - {
 *   jobId, worker:{name,email,role}, clientName,
 *   job:{summary,category,urgency,location,fullRequestText},
 *   quotedPrice, escrow:{amountSTT, txUrl}, nowIso
 * }
 * @returns {{ok, status, error?}}
 */
async function sendJobEmail(p) {
  if (!p?.worker?.email) return { ok: false, error: "worker has no email" };

  const payload = {
    jobId: p.jobId,
    timestamp: p.nowIso || "",
    worker: {
      name: esc(p.worker.name),
      email: p.worker.email, // used as the To: address — must stay raw
      role: esc(p.worker.role),
    },
    client: { name: esc(p.clientName) },
    job: {
      summary: esc(p.job.summary),
      category: esc(p.job.category),
      urgency: esc(p.job.urgency),
      location: esc(p.job.location),
      fullRequestText: esc(p.job.fullRequestText),
    },
    quotedPrice: esc(p.quotedPrice != null ? `$${p.quotedPrice}` : "—"),
    escrow: {
      amountSTT: esc(p.escrow?.amountSTT ?? ""),
      txUrl: p.escrow?.txUrl || "",
    },
  };

  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { sendJobEmail };
