"use client";
import { useEffect, useRef, useState } from "react";
import { PIPELINE } from "./steps";
import { useAuth } from "./AuthProvider";

const EXAMPLES = [
  "Fix my leaking kitchen sink urgently in Lahore",
  "My power outlet sparks — need an electrician today",
  "Deep clean a 2-bed apartment this weekend in Karachi",
];

export default function Home() {
  const [workers, setWorkers] = useState(null);

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(() => setWorkers([]));
  }, []);

  return (
    <>
      <Hero />
      <NetworkStats />
      <PostJob examples={EXAMPLES} />
      <HowItWorks />
      <Marketplace workers={workers} />
    </>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function Hero() {
  return (
    <section className="hero section">
      <div className="container hero__inner">
        <span className="pill is-violet hero__eyebrow">
          <span aria-hidden="true">⚡</span> Autonomous · On-chain · Somnia
        </span>
        <h1 className="hero__title">
          AI agents that <span className="gradient-text">hire, pay &amp; verify</span>
          <br /> service work — on their own.
        </h1>
        <p className="hero__sub muted">
          Post a job in plain English. An AI agent parses it, matches a worker, locks
          payment in on-chain escrow, verifies the result, and releases the funds —
          every step a real transaction on Somnia. No middleman, no manual approvals.
        </p>
        <div className="row gap-3 wrap hero__cta">
          <a href="#post" className="btn btn-primary btn-lg">Post a job →</a>
          <a href="/dashboard" className="btn btn-secondary btn-lg">View live dashboard</a>
        </div>

        <Pipeline />
      </div>
    </section>
  );
}

function Pipeline() {
  return (
    <div className="pipeline glass-card" role="img" aria-label="Agent pipeline: Request, Parse, Match, Escrow, Verify, Pay, Proof">
      <div className="pipeline__pulse" aria-hidden="true" />
      {PIPELINE.map((p, i) => (
        <div className="pipeline__node" key={p.label}>
          <span className="pipeline__icon" aria-hidden="true">{p.icon}</span>
          <span className="pipeline__label">{p.label}</span>
          {i < PIPELINE.length - 1 && <span className="pipeline__arrow" aria-hidden="true">→</span>}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── Network stats ──────────────────── */
function NetworkStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    // Live counters from Somnia's Blockscout stats API. Labeled as live network data.
    fetch("https://stats.somnia.w3us.site/api/v1/counters")
      .then((r) => r.json())
      .then((d) => {
        const m = Object.fromEntries((d.counters || []).map((c) => [c.id, c]));
        setStats({
          block: m.averageBlockTime?.value,
          txns: m.totalTxns?.value,
          tx24: m.newTxns24h?.value,
          fee: m.averageTxnFee24h?.value,
        });
      })
      .catch(() => setStats({}));
  }, []);

  const fmt = (v) => {
    const n = Number(v);
    if (!isFinite(n)) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toFixed(n < 10 ? 2 : 0);
  };

  return (
    <section className="container section section--tight">
      <p className="center dim stats__caption">Live Somnia Shannon testnet activity</p>
      <div className="stat-grid">
        <Stat label="Avg block time" value={stats ? (stats.block ? Number(stats.block).toFixed(2) + "s" : "—") : null} accent="cyan" />
        <Stat label="Total txns" value={stats ? fmt(stats.txns) : null} accent="violet" />
        <Stat label="Txns (24h)" value={stats ? fmt(stats.tx24) : null} accent="violet" />
        <Stat label="Avg fee (24h)" value={stats ? (stats.fee ? Number(stats.fee).toFixed(4) + " STT" : "—") : null} accent="cyan" />
      </div>
    </section>
  );
}
function Stat({ label, value, accent }) {
  return (
    <div className="stat-card">
      {value === null ? (
        <div className="skeleton" style={{ height: 28, width: "60%" }} />
      ) : (
        <div className={`value ${accent === "violet" ? "gradient-text" : ""}`} style={accent === "cyan" ? { color: "var(--cyan-400)" } : undefined}>
          {value}
        </div>
      )}
      <div className="label">{label}</div>
    </div>
  );
}

/* ──────────────────── Post a job (live) ──────────────────── */
const RUN_STEPS = [
  { key: "parsed", icon: "🧠", label: "Parsing request" },
  { key: "matched", icon: "🤝", label: "Matching best worker" },
  { key: "escrow_locked", icon: "🔒", label: "Locking escrow on Somnia" },
];

function PostJob({ examples }) {
  const { user, profile, loading } = useAuth();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [res, setRes] = useState(null);
  const [active, setActive] = useState(-1);
  const timers = useRef([]);

  // Only clients (and admins) can post jobs.
  const canPost = !loading && user && (profile?.role === "client" || profile?.role === "admin");

  function runTicker() {
    // Visual progress while the real request is in flight.
    setActive(0);
    timers.current = [
      setTimeout(() => setActive(1), 1200),
      setTimeout(() => setActive(2), 2600),
    ];
  }
  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }
  useEffect(() => () => clearTimers(), []);

  async function submit(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    setPhase("running"); setRes(null); runTicker();
    try {
      const r = await fetch("/api/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestText: text }),
      });
      const d = await r.json();
      clearTimers(); setActive(3);
      if (d.error) { setRes(d); setPhase("error"); }
      else { setRes(d); setPhase("done"); }
    } catch (err) {
      clearTimers(); setRes({ error: String(err) }); setPhase("error");
    }
  }

  function reset() {
    setPhase("idle"); setRes(null); setActive(-1); setText("");
  }

  return (
    <section id="post" className="container section" style={{ scrollMarginTop: 80 }}>
      <div className="center" style={{ marginBottom: "var(--s-5)" }}>
        <span className="eyebrow">Try it live</span>
        <h2>Post a job, then <span className="gradient-text">watch the agent work</span></h2>
        <p className="muted" style={{ maxWidth: 560, margin: "var(--s-2) auto 0" }}>
          Describe what you need. The agent does the rest — and every action lands on-chain.
        </p>
      </div>

      {!canPost && !loading && (
        <div className="glass-card glass-card--accent gate" style={{ marginBottom: "var(--s-5)" }}>
          <div className="gate__orb" aria-hidden="true">🔐</div>
          {!user ? (
            <>
              <h3>Log in to post a job</h3>
              <p className="muted" style={{ marginTop: "var(--s-2)" }}>Create a free client account to hire workers and watch the agent settle on-chain.</p>
              <a href="/login?next=/" className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>Log in / Sign up →</a>
            </>
          ) : (
            <>
              <h3>Workers can't post jobs</h3>
              <p className="muted" style={{ marginTop: "var(--s-2)" }}>You're signed in as a {profile?.role}. Switch to a client account to post jobs, or head to your portal.</p>
              <a href={profile?.role === "worker" ? "/worker" : "/dashboard"} className="btn btn-secondary" style={{ marginTop: "var(--s-4)" }}>Go to my portal →</a>
            </>
          )}
        </div>
      )}

      <div className="postgrid" style={canPost ? undefined : { display: "none" }}>
        {/* Input side */}
        <form className="glass-card glass-card--accent" onSubmit={submit} aria-busy={phase === "running"}>
          <div className="field">
            <label className="label" htmlFor="job">What do you need done?</label>
            <textarea
              id="job"
              className="textarea"
              placeholder="e.g. Fix my leaking kitchen sink urgently in Lahore"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={phase === "running"}
              rows={4}
            />
          </div>
          <div className="row gap-2 wrap" style={{ marginTop: "var(--s-3)" }}>
            {examples.map((ex) => (
              <button type="button" key={ex} className="chip" onClick={() => setText(ex)} disabled={phase === "running"}>
                {ex.length > 32 ? ex.slice(0, 32) + "…" : ex}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: "var(--s-4)" }} disabled={phase === "running" || !text.trim()}>
            {phase === "running" ? (<><span className="spinner" /> Agent working…</>) : "Submit & fund job"}
          </button>
          <p className="hint center" style={{ marginTop: "var(--s-3)" }}>
            Demo locks a small fixed amount of test STT per job. Funds are held in escrow until the work is verified.
          </p>
        </form>

        {/* Result / live side */}
        <div className="glass-card postresult" role="status" aria-live="polite">
          {phase === "idle" && (
            <div className="postresult__empty">
              <div className="postresult__orb" aria-hidden="true">✦</div>
              <p className="muted center">The agent's decisions will appear here, step by step.</p>
            </div>
          )}

          {phase !== "idle" && (
            <>
              <h3 style={{ marginBottom: "var(--s-3)" }}>Agent run</h3>
              <ol className="runlist">
                {RUN_STEPS.map((s, i) => {
                  const state = active > i ? "done" : active === i && phase === "running" ? "active" : active >= i ? "done" : "todo";
                  return (
                    <li key={s.key} className={`runstep is-${state}`}>
                      <span className="runstep__icon" aria-hidden="true">
                        {state === "active" ? <span className="spinner" /> : state === "done" ? "✓" : s.icon}
                      </span>
                      <span className="runstep__label">{s.label}</span>
                    </li>
                  );
                })}
              </ol>

              {phase === "done" && res?.worker && (
                <div className="result animate-in">
                  <div className="result__worker glass-card">
                    <div className="wkr__avatar" aria-hidden="true">{res.worker.emoji || res.worker.name?.[0]}</div>
                    <div className="stack">
                      <strong>{res.worker.name}</strong>
                      <span className="dim" style={{ fontSize: ".85rem" }}>{res.worker.role || "Worker"} · matched by AI</span>
                    </div>
                    <span className="pill is-success" style={{ marginLeft: "auto" }}>
                      <span className="mono">{res.amount} STT</span>
                    </span>
                  </div>
                  {res.job?.summary && <p className="muted" style={{ marginTop: "var(--s-3)" }}>“{res.job.summary}”</p>}
                  {res.escrowTx?.url && (
                    <a className="tx-pill" href={res.escrowTx.url} target="_blank" rel="noreferrer" style={{ marginTop: "var(--s-3)" }}>
                      🔒 Escrow tx ↗
                    </a>
                  )}
                  <div className="result__actions">
                    <a className="btn btn-secondary btn-sm" href={`/worker?uuid=${res.uuid}`}>Submit proof as worker →</a>
                    <a className="btn btn-ghost btn-sm" href="/dashboard">Watch on dashboard</a>
                  </div>
                  <p className="hint" style={{ marginTop: "var(--s-3)" }}>
                    Job ID: <span className="mono">{res.uuid}</span>
                  </p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={reset} style={{ marginTop: "var(--s-2)" }}>Post another</button>
                </div>
              )}

              {phase === "error" && (
                <div className="result animate-in">
                  <div className="pill is-danger"><span aria-hidden="true">⚠</span> {res?.error || "Something went wrong"}</div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={reset} style={{ marginTop: "var(--s-3)" }}>Try again</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── How it works ──────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", icon: "🧠", title: "The agent understands", body: "GPT-4o parses your plain-English request into category, urgency, location and a fair budget." },
    { n: "02", icon: "🔒", title: "Escrow locks on-chain", body: "It picks the best worker and locks payment in a Somnia smart contract — funds are safe until the job is done." },
    { n: "03", icon: "📜", title: "Verify, pay & prove", body: "When proof arrives, the agent verifies it, releases payment automatically, and records an immutable proof hash." },
  ];
  return (
    <section className="container section">
      <div className="center" style={{ marginBottom: "var(--s-6)" }}>
        <span className="eyebrow">How it works</span>
        <h2>Three steps, zero middlemen</h2>
      </div>
      <div className="how stagger">
        {steps.map((s) => (
          <div className="glass-card glass-card--hover how__card" key={s.n}>
            <div className="row gap-3" style={{ justifyContent: "space-between" }}>
              <span className="how__icon" aria-hidden="true">{s.icon}</span>
              <span className="how__n mono dim">{s.n}</span>
            </div>
            <h3 style={{ marginTop: "var(--s-3)" }}>{s.title}</h3>
            <p className="muted" style={{ marginTop: "var(--s-2)" }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────── Marketplace ──────────────────── */
function Marketplace({ workers }) {
  return (
    <section className="container section">
      <div className="center" style={{ marginBottom: "var(--s-6)" }}>
        <span className="eyebrow">The marketplace</span>
        <h2>Workers the agent can <span className="gradient-text">hire</span></h2>
        <p className="muted" style={{ maxWidth: 520, margin: "var(--s-2) auto 0" }}>
          A live pool of verified providers. The AI matches the right one to every job.
        </p>
      </div>

      {workers === null ? (
        <div className="wkr-grid">
          {[0, 1, 2].map((i) => <div key={i} className="glass-card" style={{ height: 200 }}><div className="skeleton" style={{ height: "100%" }} /></div>)}
        </div>
      ) : workers.length === 0 ? (
        <p className="center dim">Worker pool unavailable right now.</p>
      ) : (
        <div className="wkr-grid stagger">
          {workers.map((w) => (
            <article className="glass-card glass-card--hover wkr" key={w.id}>
              <div className="row gap-3">
                <div className="wkr__avatar" aria-hidden="true">{w.emoji || w.name?.[0]}</div>
                <div className="stack">
                  <strong>{w.name}</strong>
                  <span className="dim" style={{ fontSize: ".85rem" }}>{w.role}</span>
                </div>
                <span className={`pill ${w.available ? "is-success" : "is-pending"} wkr__avail`}>
                  <span className="dot" aria-hidden="true" /> {w.available ? "Available" : "Busy"}
                </span>
              </div>
              {w.tagline && <p className="muted wkr__tag clamp-2">{w.tagline}</p>}
              <div className="row gap-2 wrap wkr__skills">
                {w.skills?.map((s) => <span className="chip" key={s}>{s}</span>)}
              </div>
              <div className="row wkr__foot">
                <span className="wkr__rating" title={`${w.rating} rating`}>
                  <span aria-hidden="true">★</span> {w.rating}
                </span>
                <span className="dim" style={{ fontSize: ".82rem" }}>{w.jobsDone} jobs · {w.location}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
