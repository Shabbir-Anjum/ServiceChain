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

      {profile && profile.role === "worker" && !profile.profile_complete && (
        <div className="glass-card glass-card--accent gate" style={{ marginBottom: "var(--s-5)", maxWidth: 640 }}>
          <div className="gate__orb" aria-hidden="true">⚙️</div>
          <h3>Finish setting up your profile</h3>
          <p className="muted" style={{ marginTop: "var(--s-2)" }}>You won't appear in the marketplace or get matched until you add your wallet, rate and availability.</p>
          <a href="/profile/setup" className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>Complete profile →</a>
        </div>
      )}

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
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | uploading | submitting | done | error
  const [res, setRes] = useState(null);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!proof.trim()) return;
    setRes(null);
    try {
      let photoUrl = null;
      if (file) {
        setPhase("uploading");
        const fd = new FormData();
        fd.append("uuid", job.uuid);
        fd.append("file", file);
        const ur = await fetch("/api/proof/upload", { method: "POST", body: fd });
        const ud = await ur.json();
        if (ud.error) { setRes({ error: "Photo upload failed: " + ud.error }); setPhase("error"); return; }
        photoUrl = ud.url;
      }
      setPhase("submitting");
      const r = await fetch("/api/proof", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: job.uuid, proofText: proof, photoUrl }),
      });
      const d = await r.json();
      if (d.error) { setRes(d); setPhase("error"); }
      else { setRes(d); setPhase("done"); }
    } catch (err) { setRes({ error: String(err) }); setPhase("error"); }
  }

  const busy = phase === "uploading" || phase === "submitting";

  return (
    <div className="worker__grid">
      <form className="glass-card glass-card--accent" onSubmit={submit} aria-busy={busy}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "var(--s-3)" }}>← Back to jobs</button>
        <h3>{job.job?.summary || job.requestText}</h3>
        <p className="muted" style={{ margin: "var(--s-2) 0 var(--s-4)" }}>{job.requestText}</p>

        <div className="field">
          <label className="label">Photo evidence <span className="dim">(recommended)</span></label>
          <label className="uploader">
            {preview ? (
              <img src={preview} alt="proof preview" className="uploader__preview" />
            ) : (
              <span className="uploader__placeholder"><span aria-hidden="true">📷</span> Tap to add a before/after photo</span>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={pickFile} disabled={busy} hidden />
          </label>
          {!file && <p className="hint">No photo? You can still submit, but the client sees stronger evidence with one.</p>}
        </div>

        <div className="field" style={{ marginTop: "var(--s-3)" }}>
          <label className="label" htmlFor="proof">What did you do?</label>
          <textarea id="proof" className="textarea" placeholder="Describe the work, parts used, and how you tested it…" value={proof} onChange={(e) => setProof(e.target.value)} disabled={busy} rows={4} />
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: "var(--s-4)" }} disabled={busy || !proof.trim()}>
          {phase === "uploading" ? <><span className="spinner" /> Uploading photo…</> : phase === "submitting" ? <><span className="spinner" /> Submitting…</> : "Submit for client approval"}
        </button>
        <p className="hint center" style={{ marginTop: "var(--s-3)" }}>Your payment is released once the client approves the work.</p>
      </form>

      <div className="glass-card worker__result" role="status" aria-live="polite">
        {phase === "idle" && <div className="postresult__empty"><div className="postresult__orb" aria-hidden="true">📨</div><p className="muted center">Submit your proof — the client reviews it and releases your payment.</p></div>}
        {busy && <div className="postresult__empty"><span className="spinner" style={{ width: 28, height: 28 }} /><p className="muted center">{phase === "uploading" ? "Uploading photo…" : "Submitting your proof…"}</p></div>}
        {phase === "done" && res && (
          <div className="animate-in stack gap-4">
            <div className="verdict verdict--ok">
              <div className="postresult__orb" aria-hidden="true" style={{ width: 56, height: 56, fontSize: "1.4rem" }}>✓</div>
              <div className="stack gap-1">
                <span className="pill is-pending"><span className="dot" aria-hidden="true" /> Awaiting client approval</span>
                <strong style={{ fontSize: "1.05rem" }}>Proof submitted</strong>
              </div>
            </div>
            {res.ai && (
              <div className="glass-card verdict__reason">
                <span className="dim" style={{ fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em" }}>👁️ AI pre-check (advisory)</span>
                <p className="muted" style={{ marginTop: 4 }}>
                  {res.ai.looksConsistent === true ? "Looks consistent with the job. " : res.ai.looksConsistent === false ? "Couldn't confirm from the evidence. " : ""}
                  {res.ai.notes}
                </p>
              </div>
            )}
            {res.onchain?.source === "somnia-onchain" && (
              <div className="glass-card verdict__reason" style={{ borderColor: "var(--border-violet)", background: "var(--tint-violet)" }}>
                <span style={{ fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--violet-400)" }}>⛓️ Verified on-chain by Somnia's LLM agent</span>
                <p className="muted" style={{ marginTop: 4 }}>
                  Consensus verdict: <strong style={{ color: res.onchain.decision === "approved" ? "var(--success)" : "var(--danger)" }}>{res.onchain.decision}</strong> — validator-run, on Somnia's Agentic L1.
                  {res.onchain.txUrl && <> · <a className="tx-pill" href={res.onchain.txUrl} target="_blank" rel="noreferrer" style={{ marginTop: 6 }}>view tx ↗</a></>}
                </p>
              </div>
            )}
            <p className="muted" style={{ fontSize: ".9rem" }}>The client has been notified. Once they approve, the escrowed payment is released to your wallet automatically.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onDone}>Back to my jobs →</button>
          </div>
        )}
        {phase === "error" && <div className="animate-in"><div className="pill is-danger"><span aria-hidden="true">⚠</span> {res?.error || "Something went wrong"}</div><button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase("idle")} style={{ marginTop: "var(--s-3)" }}>Try again</button></div>}
      </div>
    </div>
  );
}
