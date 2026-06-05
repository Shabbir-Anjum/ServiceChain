// POST /api/job — client submits a request. Agent parses, matches, locks escrow.
// Requires a logged-in client (or admin). The job is stamped with client_id and
// the matched worker_id so role-based visibility works.
import { NextResponse } from "next/server";
const { startJob } = require("../../../agent/index.js");
const { WORKERS } = require("../../workers.js");
const store = require("../../../lib/jobstore.js");
const { supabase: svc } = require("../../../lib/supabase.js"); // service role — reads wallet
const crypto = require("crypto");
import { requireRole } from "../../../lib/auth";

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

    // Load the matchable worker pool from the DB using the SERVICE ROLE client
    // (it can read `wallet`, which anon can't). Only complete + available
    // workers are matchable. Fall back to the seed file if the DB is down.
    let pool = WORKERS;
    try {
      if (svc) {
        const { data } = await svc
          .from("profiles")
          .select("id, full_name, job_role, emoji, skills, rating, jobs_done, available, location, bio, wallet")
          .eq("role", "worker")
          .eq("profile_complete", true)
          .eq("available", true);
        if (data && data.length) {
          pool = data.map((w) => ({
            id: w.id, name: w.full_name, role: w.job_role, emoji: w.emoji,
            skills: w.skills, rating: w.rating, jobsDone: w.jobs_done,
            available: w.available, location: w.location, tagline: w.bio, wallet: w.wallet,
          }));
        }
      }
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
