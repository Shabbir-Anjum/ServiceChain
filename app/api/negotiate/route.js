// POST /api/negotiate — negotiation chat. The agent convinces, can swap in a
// different worker from the pool, and signals acceptance. No on-chain action here.
import { NextResponse } from "next/server";
const { negotiate } = require("../../../agent/negotiate.js");
const { loadPool } = require("../../../lib/pool.js");
const store = require("../../../lib/jobstore.js");
import { requireRole } from "../../../lib/auth";

function publicWorker(w) {
  if (!w) return null;
  const { wallet, email, ...safe } = w;
  return safe;
}

export async function POST(req) {
  try {
    const auth = await requireRole("client", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { uuid, message, history, primaryId, alternativeId, primaryQuote, alternativeQuote } = await req.json();
    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (rec.clientId && rec.clientId !== auth.user.id && auth.profile.role !== "admin") {
      return NextResponse.json({ error: "not your job" }, { status: 403 });
    }

    const pool = await loadPool();
    const byId = Object.fromEntries(pool.map((w) => [String(w.id), w]));
    const primary = primaryId ? byId[String(primaryId)] : null;
    const alternative = alternativeId ? byId[String(alternativeId)] : null;
    if (primary && primaryQuote != null) primary.quotedPrice = primaryQuote;
    if (alternative && alternativeQuote != null) alternative.quotedPrice = alternativeQuote;

    const result = await negotiate({ job: rec.job, primary, alternative, pool, history: history || [], message });

    // If the agent swapped to a new worker, attach that worker (public) + quote.
    let newWorker = null;
    if (result.action === "recommend" && result.recommendWorkerId) {
      const w = byId[String(result.recommendWorkerId)];
      if (w) {
        const quote = result.recommendQuoteUsd || Math.max(20, Math.round((w.hourlyRate || 20) * 3));
        newWorker = { ...publicWorker(w), quotedPrice: quote, why: result.reply, highlights: [`${w.rating}★ · ${w.jobsDone} jobs`, w.location].filter(Boolean) };
      }
    }

    return NextResponse.json({ ...result, newWorker });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
