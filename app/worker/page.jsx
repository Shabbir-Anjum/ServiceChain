"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthProvider";

export default function WorkerPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return <section className="container section"><div className="skeleton" style={{ height: 200, borderRadius: 16 }} /></section>;

  if (!user) {
    return (
      <Gate
        emoji="🔐"
        title="Log in to your worker portal"
        body="Sign in to see jobs the AI agent assigned to you and submit proof of completion."
        cta={{ href: "/login?next=/worker", label: "Log in / Sign up →" }}
      />
    );
  }
  if (profile?.role !== "worker" && profile?.role !== "admin") {
    return (
      <Gate
        emoji="🛠️"
        title="This portal is for workers"
        body={`You're signed in as a ${profile?.role}. Only workers see assigned jobs here.`}
        cta={{ href: "/dashboard", label: "Go to dashboard →" }}
      />
    );
  }
  return <WorkerPortal profile={profile} />;
}

function Gate({ emoji, title, body, cta }) {
  return (
    <section className="container section">
      <div className="glass-card glass-card--accent gate">
        <div className="gate__orb" aria-hidden="true">{emoji}</div>
        <h3>{title}</h3>
        <p className="muted" style={{ marginTop: "var(--s-2)" }}>{body}</p>
        <a href={cta.href} className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>{cta.label}</a>
      </div>
    </section>
  );
}

function WorkerPortal({ profile }) {
  const [jobs, setJobs] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/status");
    const d = await r.json();
    setJobs(d.jobs || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = (jobs || []).filter((j) => j.status === "escrow_locked");
  const settled = (jobs || []).filter((j) => j.status === "paid" || j.status === "refunded");

  return (
    <section className="container section">
      <div className="center" style={{ marginBottom: "var(--s-6)" }}>
        <span className="eyebrow">Worker portal</span>
        <h2>Your <span className="gradient-text">assigned jobs</span></h2>
        <p className="muted" style={{ maxWidth: 560, margin: "var(--s-2) auto 0" }}>
          The AI agent matched these to you. Submit proof and it verifies, then releases your STT on Somnia.
        </p>
      </div>

      {selected ? (
        <ProofForm job={selected} onBack={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />
      ) : jobs === null ? (
        <div className="job-grid">{[0, 1].map((i) => <div key={i} className="glass-card" style={{ height: 140 }}><div className="skeleton" style={{ height: "100%" }} /></div>)}</div>
      ) : (
        <>
          <h3 style={{ marginBottom: "var(--s-3)" }}>Awaiting your proof ({pending.length})</h3>
          {pending.length === 0 ? (
            <div className="glass-card empty-state" style={{ padding: "var(--s-6)" }}>
              <div className="empty-state__orb" aria-hidden="true">📭</div>
              <p className="muted">No jobs awaiting proof. When the agent assigns you a job, it'll show here.</p>
            </div>
          ) : (
            <div className="job-grid" style={{ marginBottom: "var(--s-6)" }}>
              {pending.map((j) => (
                <button type="button" key={j.uuid} className="glass-card glass-card--hover job assigned" onClick={() => setSelected(j)} style={{ textAlign: "left", cursor: "pointer" }}>
                  <div className="job__head">
                    <span className="job__summary clamp-2">{j.job?.summary || j.requestText}</span>
                    <span className="pill is-violet">{j.amount} STT</span>
                  </div>
                  <p className="muted clamp-2" style={{ fontSize: ".9rem" }}>{j.requestText}</p>
                  <span className="btn btn-secondary btn-sm" style={{ marginTop: "auto", alignSelf: "flex-start" }}>Submit proof →</span>
                </button>
              ))}
            </div>
          )}

          {settled.length > 0 && (
            <>
              <h3 style={{ marginBottom: "var(--s-3)" }}>Completed ({settled.length})</h3>
              <div className="job-grid">
                {settled.map((j) => (
                  <div key={j.uuid} className="glass-card job">
                    <div className="job__head">
                      <span className="job__summary clamp-2">{j.job?.summary || j.requestText}</span>
                      <span className={`pill ${j.status === "paid" ? "is-success" : "is-danger"}`}>{j.status === "paid" ? "Paid" : "Refunded"}</span>
                    </div>
                    <span className="dim" style={{ fontSize: ".85rem" }}>{j.amount} STT</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ProofForm({ job, onBack, onDone }) {
  const [proof, setProof] = useState("");
  const [phase, setPhase] = useState("idle");
  const [res, setRes] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!proof.trim()) return;
    setPhase("running"); setRes(null);
    try {
      const r = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: job.uuid, proofText: proof }),
      });
      const d = await r.json();
      if (d.error) { setRes(d); setPhase("error"); }
      else { setRes(d); setPhase("done"); }
    } catch (err) { setRes({ error: String(err) }); setPhase("error"); }
  }

  const approved = res?.verdict?.decision === "approved";
  const confidence = Math.round((res?.verdict?.confidence || 0) * 100);

  return (
    <div className="worker__grid">
      <form className="glass-card glass-card--accent" onSubmit={submit} aria-busy={phase === "running"}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "var(--s-3)" }}>← Back to jobs</button>
        <h3>{job.job?.summary || job.requestText}</h3>
        <p className="muted" style={{ margin: "var(--s-2) 0 var(--s-4)" }}>{job.requestText} · <span className="mono">{job.amount} STT</span> in escrow</p>
        <div className="field">
          <label className="label" htmlFor="proof">Proof of completion</label>
          <textarea id="proof" className="textarea" placeholder="Describe exactly what you did, parts used, and how you tested it…" value={proof} onChange={(e) => setProof(e.target.value)} disabled={phase === "running"} rows={5} />
          <p className="hint">Tip: be specific. “Replaced the U-bend, sealed the joint, ran water 5 min — no leaks.”</p>
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: "var(--s-4)" }} disabled={phase === "running" || !proof.trim()}>
          {phase === "running" ? <><span className="spinner" /> Agent verifying…</> : "Submit proof"}
        </button>
      </form>

      <div className="glass-card worker__result" role="status" aria-live="polite">
        {phase === "idle" && <div className="postresult__empty"><div className="postresult__orb" aria-hidden="true">🔍</div><p className="muted center">The agent's verdict and on-chain settlement will appear here.</p></div>}
        {phase === "running" && <div className="postresult__empty"><span className="spinner" style={{ width: 28, height: 28 }} /><p className="muted center">Verifying your proof…</p></div>}
        {phase === "done" && res && (
          <div className="animate-in stack gap-4">
            <div className={`verdict ${approved ? "verdict--ok" : "verdict--no"}`}>
              <ConfidenceRing value={confidence} ok={approved} />
              <div className="stack gap-1">
                <span className={`pill ${approved ? "is-success" : "is-danger"}`}>{approved ? "✓ Approved" : "✕ Rejected"}</span>
                <strong style={{ fontSize: "1.1rem" }}>{approved ? "Payment released" : "Client refunded"}</strong>
              </div>
            </div>
            {res.verdict?.reason && <div className="glass-card verdict__reason"><span className="dim" style={{ fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Agent reasoning</span><p className="muted" style={{ marginTop: 4 }}>{res.verdict.reason}</p></div>}
            <div className="stack gap-2">
              {res.settleTx?.url && <a className="tx-pill" href={res.settleTx.url} target="_blank" rel="noreferrer">{approved ? "💸 Payment tx ↗" : "↩️ Refund tx ↗"}</a>}
              {res.proofTx?.url && <a className="tx-pill" href={res.proofTx.url} target="_blank" rel="noreferrer">📜 Proof recorded tx ↗</a>}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onDone}>Back to my jobs →</button>
          </div>
        )}
        {phase === "error" && <div className="animate-in"><div className="pill is-danger"><span aria-hidden="true">⚠</span> {res?.error || "Something went wrong"}</div><button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase("idle")} style={{ marginTop: "var(--s-3)" }}>Try again</button></div>}
      </div>
    </div>
  );
}

function ConfidenceRing({ value, ok }) {
  const r = 26, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = ok ? "var(--success)" : "var(--danger)";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`Agent confidence ${value}%`} className="ring">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 700ms var(--t-slow)" }} />
      <text x="36" y="40" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700" fontFamily="var(--font-mono)">{value}%</text>
    </svg>
  );
}
