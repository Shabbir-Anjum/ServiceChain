// POST /api/job — client posts a request. Agent parses + RECOMMENDS 1-2 workers.
// No escrow yet — that happens at /api/job/confirm after the client picks.
import { NextResponse } from "next/server";
const { recommendJob } = require("../../../agent/index.js");
const { loadPool } = require("../../../lib/pool.js");
const store = require("../../../lib/jobstore.js");
const crypto = require("crypto");
import { requireRole } from "../../../lib/auth";

// Strip wallet/email before sending a worker to the browser.
function publicWorker(w) {
  if (!w) return null;
  const { wallet, email, ...safe } = w;
  return safe;
}

export async function POST(req) {
  try {
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { requestText } = await req.json();
    if (!requestText) return NextResponse.json({ error: "requestText required" }, { status: 400 });

    const uuid = crypto.randomUUID();
    await store.create(uuid, requestText, auth.user.id);

    const pool = await loadPool();
    const { job, primary, alternative, steps } = await recommendJob(uuid, requestText, pool);

    await store.update(uuid, { job, status: "recommending" });
    await store.pushSteps(uuid, steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({
      uuid,
      job,
      primary: publicWorker(primary),
      alternative: publicWorker(alternative),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
