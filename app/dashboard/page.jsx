"use client";
import { useEffect, useRef, useState } from "react";
import { STEP_MAP, STATUS_PILL } from "../steps";
import { useAuth } from "../AuthProvider";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [stale, setStale] = useState(false);
  const last = useRef([]);

  // Only poll while signed in. Hooks must run unconditionally (before any early
  // return) or React throws "rendered fewer hooks than expected" on logout.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/status");
        const d = await r.json();
        if (!alive) return;
        last.current = d.jobs || [];
        setJobs(d.jobs || []);
        setStale(false);
      } catch {
        if (!alive) return;
        setJobs(last.current); // keep last data on network blip
        setStale(true);
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [user]);

  if (!loading && !user) {
    return (
      <section className="container section">
        <div className="glass-card glass-card--accent gate">
          <div className="gate__orb" aria-hidden="true">🔐</div>
          <h3>Log in to see your dashboard</h3>
          <p className="muted" style={{ marginTop: "var(--s-2)" }}>Clients see their own jobs, workers see assigned jobs, admins see everything.</p>
          <a href="/login?next=/dashboard" className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>Log in / Sign up →</a>
        </div>
      </section>
    );
  }

  const totals = aggregate(jobs || []);

  return (
    <section className="container section">
      <div className="dash__head">
        <div>
          <span className="eyebrow">Live operations</span>
          <h2 style={{ margin: 0 }}>
            {profile?.role === "admin" ? "All agent activity" : profile?.role === "worker" ? "My assigned jobs" : "My jobs"}
          </h2>
        </div>
        <div className="row gap-3">
          {stale && <span className="pill is-pending"><span aria-hidden="true">⟳</span> Reconnecting…</span>}
          <span className="pill is-success pill--live">
            <span className="dot" aria-hidden="true" /> Live · {jobs?.length ?? 0} job{jobs?.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="dash__tiles">
        <Tile label="Total jobs" value={totals.jobs} accent="violet" />
        <Tile label="STT escrowed" value={`${totals.stt.toFixed(2)}`} suffix="STT" accent="cyan" />
        <Tile label="Settled" value={totals.settled} suffix={`/ ${totals.jobs}`} accent="violet" />
      </div>

      {jobs === null ? (
        <div className="job-grid">
          {[0, 1].map((i) => <div key={i} className="glass-card" style={{ height: 320 }}><div className="skeleton" style={{ height: "100%" }} /></div>)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state__orb" aria-hidden="true">✦</div>
          <h3>No jobs yet</h3>
          <p className="muted" style={{ marginTop: "var(--s-2)" }}>Post a job and watch the agent hire, pay and verify in real time.</p>
          <a className="btn btn-primary" href="/" style={{ marginTop: "var(--s-4)" }}>Post a job →</a>
        </div>
      ) : (
        <div className="job-grid">
          {jobs.map((j) => <JobCard key={j.uuid} job={j} role={profile?.role} />)}
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, suffix, accent }) {
  return (
    <div className="stat-card">
      <div className={`value ${accent === "violet" ? "gradient-text" : ""}`} style={accent === "cyan" ? { color: "var(--cyan-400)" } : undefined}>
        {value} {suffix && <span style={{ fontSize: "0.7em", color: "var(--text-muted)" }}>{suffix}</span>}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

function JobCard({ job, role }) {
  const pill = STATUS_PILL[job.status] || { cls: "is-info", label: job.status };
  const [deciding, setDeciding] = useState(null); // 'approve' | 'dispute'
  const [decided, setDecided] = useState(null);
  const [err, setErr] = useState(null);
  const [showDispute, setShowDispute] = useState(false); // reveal the reason box
  const [reason, setReason] = useState("");

  // The client (or admin) can review + decide when proof is submitted.
  const canDecide = (role === "client" || role === "admin") && job.status === "proof_submitted" && !decided;

  async function decide(decision, reasonText) {
    setDeciding(decision); setErr(null);
    try {
      const r = await fetch("/api/job/decision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: job.uuid, decision, reason: reasonText }),
      });
      const d = await r.json();
      if (d.error) { setErr(d.error); setDeciding(null); }
      else setDecided(d.approved ? "approved" : "disputed");
    } catch (e) { setErr(String(e)); setDeciding(null); }
  }

  return (
    <article className="glass-card job">
      <div className="job__head">
        <div className="stack gap-1" style={{ minWidth: 0 }}>
          <span className="job__summary clamp-2">{job.job?.summary || job.requestText}</span>
          {job.worker && (
            <span className="job__meta">
              <span aria-hidden="true">{job.worker.emoji || "👤"}</span>
              {job.worker.name}
              {job.amount != null && <> · <span className="mono">{job.amount} STT</span></>}
            </span>
          )}
        </div>
        <span className={`pill ${pill.cls}`} style={{ flex: "none" }}>{pill.label}</span>
      </div>

      {/* Proof review + client decision */}
      {job.status === "proof_submitted" && (
        <div className="proof-review">
          {job.proofPhotoUrl ? (
            <a href={job.proofPhotoUrl} target="_blank" rel="noreferrer" className="proof-photo">
              <img src={job.proofPhotoUrl} alt="proof of work" />
            </a>
          ) : (
            <div className="pill is-pending" style={{ fontSize: ".72rem" }}>⚠ No photo evidence</div>
          )}
          {job.proofText && <p className="muted" style={{ fontSize: ".9rem", marginTop: "var(--s-2)" }}>“{job.proofText}”</p>}
          {job.aiCheck && (
            <div className="ai-advisory">
              <span aria-hidden="true">👁️</span> AI pre-check: {job.aiCheck.looksConsistent === true ? "looks consistent" : job.aiCheck.looksConsistent === false ? "couldn't confirm" : "n/a"}
              {job.aiCheck.notes ? ` — ${job.aiCheck.notes}` : ""}
            </div>
          )}
          {job.aiCheck?.onchain?.source === "somnia-onchain" && (
            <div className="ai-advisory" style={{ background: "var(--tint-violet)", borderColor: "var(--border-violet)", color: "var(--violet-400)" }}>
              <span aria-hidden="true">⛓️</span> Somnia on-chain LLM verdict: <strong>{job.aiCheck.onchain.decision}</strong> (validator consensus)
              {job.aiCheck.onchain.txUrl && <> · <a href={job.aiCheck.onchain.txUrl} target="_blank" rel="noreferrer" style={{ color: "var(--cyan-400)" }}>tx ↗</a></>}
            </div>
          )}
          {canDecide && !showDispute && (
            <div className="row gap-2" style={{ marginTop: "var(--s-3)" }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => decide("approve")} disabled={!!deciding}>
                {deciding === "approve" ? <span className="spinner" /> : "✓ Approve & pay"}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDispute(true)} disabled={!!deciding}>
                ✕ Dispute
              </button>
            </div>
          )}
          {canDecide && showDispute && (
            <div className="stack gap-2" style={{ marginTop: "var(--s-3)" }}>
              <textarea
                className="textarea" rows={2}
                placeholder="Why are you disputing? e.g. work not done, wrong photo, poor quality…"
                value={reason} onChange={(e) => setReason(e.target.value)} disabled={!!deciding}
                style={{ minHeight: 64 }}
              />
              <div className="row gap-2">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => decide("dispute", reason)} disabled={!!deciding || reason.trim().length < 3}>
                  {deciding === "dispute" ? <span className="spinner" /> : "Confirm dispute & refund"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowDispute(false); setReason(""); }} disabled={!!deciding}>Cancel</button>
              </div>
            </div>
          )}
          {!canDecide && role === "worker" && <p className="hint" style={{ marginTop: "var(--s-2)" }}>Awaiting the client's approval.</p>}
          {decided && <div className={`pill ${decided === "approved" ? "is-success" : "is-danger"}`} style={{ marginTop: "var(--s-2)" }}>{decided === "approved" ? "Payment released" : "Refunded"}</div>}
          {err && <div className="pill is-danger" style={{ marginTop: "var(--s-2)" }}>{err}</div>}
        </div>
      )}

      {/* Recorded dispute reason on a refunded job */}
      {job.status === "refunded" && job.disputeReason && (
        <div className="ai-advisory" style={{ borderColor: "rgba(251,113,133,0.3)", background: "var(--danger-dim)", color: "var(--danger)" }}>
          <span aria-hidden="true">↩️</span> Disputed: {job.disputeReason}
        </div>
      )}

      <ol className="timeline">
        {(job.steps || []).map((s, i) => {
          const meta = STEP_MAP[s.step] || { icon: "•", label: s.step, status: "info" };
          const statusCls = meta.status === "success" ? "is-success" : meta.status === "danger" ? "is-danger" : meta.status === "violet" ? "is-violet" : "";
          const detail = s.payload?.reason
            || (s.payload?.decision ? `${s.payload.decision} · ${Math.round((s.payload.confidence || 0) * 100)}% confidence` : null);
          return (
            <li key={i} className={`tl ${statusCls}`}>
              <span className="tl__icon" aria-hidden="true">{meta.icon}</span>
              <div className="tl__body">
                <div className="row gap-2 wrap" style={{ justifyContent: "space-between" }}>
                  <span className="tl__label">{meta.label}</span>
                  {s.payload?.url && (
                    <a className="tx-pill" href={s.payload.url} target="_blank" rel="noreferrer">tx ↗</a>
                  )}
                </div>
                {detail && <div className="tl__detail clamp-2">{detail}</div>}
              </div>
            </li>
          );
        })}
        {(!job.steps || job.steps.length === 0) && (
          <li className="tl"><span className="tl__icon"><span className="spinner" style={{ width: 14, height: 14 }} /></span><div className="tl__body"><span className="tl__label dim">Agent starting…</span></div></li>
        )}
      </ol>
    </article>
  );
}

function aggregate(jobs) {
  let stt = 0, settled = 0;
  for (const j of jobs) {
    if (j.amount) stt += Number(j.amount) || 0;
    if (j.status === "paid" || j.status === "refunded") settled++;
  }
  return { jobs: jobs.length, stt, settled };
}
