// POST /api/job — client submits a request. Agent parses, matches, locks escrow.
// Requires a logged-in client (or admin). The job is stamped with client_id and
// the matched worker_id so role-based visibility works.
import { NextResponse } from "next/server";
const { startJob } = require("../../../agent/index.js");
const { WORKERS } = require("../../workers.js");
const store = require("../../../lib/jobstore.js");
const crypto = require("crypto");
import { requireRole } from "../../../lib/auth";
import { createClient as createSb } from "../../../lib/supabase/server";

export async function POST(req) {
  try {
    // Must be a client or admin to post a job.
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { requestText } = await req.json();
    if (!requestText) {
      return NextResponse.json({ error: "requestText required" }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    await store.create(uuid, requestText, auth.user.id);

    // The marketplace pool may live in the DB now — load it so matching uses the
    // full ~20 workers, falling back to the seed file.
    let pool = WORKERS;
    try {
      const sb = await createSb();
      const { data } = await sb.from("workers").select("*").eq("available", true);
      if (data && data.length) pool = data.map((w) => ({ ...w, jobsDone: w.jobs_done }));
    } catch { /* use seed */ }

    // Agent autonomously: parse -> match -> lock escrow on-chain.
    const result = await startJob(uuid, requestText, pool);
    await store.update(uuid, {
      job: result.job,
      worker: result.worker,
      workerId: result.worker?.id || null,
      estimated: result.estimated,
      amount: result.amount,
      status: "escrow_locked",
    });
    await store.pushSteps(uuid, result.steps.map((s) => ({ step: s.step, payload: s.payload })));

    return NextResponse.json({ uuid, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
