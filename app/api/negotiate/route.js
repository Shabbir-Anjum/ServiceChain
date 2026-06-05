// POST /api/negotiate — negotiation chat. The agent convinces/handles objections
// and signals when the client accepts a worker (action=confirm + confirmWorkerId).
// No on-chain action here — the UI must call /api/job/confirm explicitly.
import { NextResponse } from "next/server";
const { negotiate } = require("../../../agent/negotiate.js");
const { workerById } = require("../../../lib/pool.js");
const store = require("../../../lib/jobstore.js");
import { requireRole } from "../../../lib/auth";

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

    // Rehydrate the recommended workers (with quote, the chat needs them).
    const primary = primaryId ? await workerById(primaryId) : null;
    const alternative = alternativeId ? await workerById(alternativeId) : null;
    if (primary && primaryQuote != null) primary.quotedPrice = primaryQuote;
    if (alternative && alternativeQuote != null) alternative.quotedPrice = alternativeQuote;

    const result = await negotiate({
      job: rec.job,
      primary,
      alternative,
      history: history || [],
      message,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
