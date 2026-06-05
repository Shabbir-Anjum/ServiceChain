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

/* ──────────────────── Post a job → recommend → negotiate → confirm ──────────────────── */
function PostJob({ examples }) {
  const { user, profile, loading } = useAuth();
  const canPost = !loading && user && (profile?.role === "client" || profile?.role === "admin");

  return (
    <section id="post" className="container section" style={{ scrollMarginTop: 80 }}>
      <div className="center" style={{ marginBottom: "var(--s-5)" }}>
        <span className="eyebrow">Try it live</span>
        <h2>Post a job, the agent <span className="gradient-text">recommends &amp; negotiates</span></h2>
        <p className="muted" style={{ maxWidth: 580, margin: "var(--s-2) auto 0" }}>
          Describe what you need. The agent suggests the best worker, talks you through price &amp; quality,
          and locks escrow on-chain only when you confirm.
        </p>
      </div>

      {!canPost && !loading && (
        <div className="glass-card glass-card--accent gate">
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

      {canPost && <HireFlow examples={examples} />}
    </section>
  );
}

/* The recommend → negotiate → confirm experience. */
function HireFlow({ examples }) {
  const [text, setText] = useState("");
  // stage: input | recommending | recommend | confirming | done | error
  const [stage, setStage] = useState("input");
  const [uuid, setUuid] = useState(null);
  const [job, setJob] = useState(null);
  const [primary, setPrimary] = useState(null);
  const [alternative, setAlternative] = useState(null);
  const [chat, setChat] = useState([]); // {role:'agent'|'client', text}
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chat]);

  async function postJob(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    setStage("recommending"); setError(null);
    try {
      const r = await fetch("/api/job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestText: text }) });
      const d = await r.json();
      if (d.error) { setError(d.error); setStage("error"); return; }
      setUuid(d.uuid); setJob(d.job); setPrimary(d.primary); setAlternative(d.alternative);
      setChat([{ role: "agent", text: agentIntro(d) }]);
      setStage("recommend");
    } catch (err) { setError(String(err)); setStage("error"); }
  }

  async function sendChat(e) {
    e?.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatBusy) return;
    const history = [...chat];
    setChat((c) => [...c, { role: "client", text: msg }]);
    setChatInput(""); setChatBusy(true);
    try {
      const r = await fetch("/api/negotiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid, message: msg, history,
          primaryId: primary?.id, alternativeId: alternative?.id,
          primaryQuote: primary?.quotedPrice, alternativeQuote: alternative?.quotedPrice,
        }),
      });
      const d = await r.json();
      if (d.error) { setChat((c) => [...c, { role: "agent", text: "Sorry — " + d.error }]); }
      else {
        setChat((c) => [...c, { role: "agent", text: d.reply }]);
        if (d.action === "confirm" && d.confirmWorkerId) {
          // The agent detected acceptance — confirm that worker.
          confirm(d.confirmWorkerId);
        }
      }
    } catch (err) { setChat((c) => [...c, { role: "agent", text: "Network error. Try again." }]); }
    finally { setChatBusy(false); }
  }

  async function confirm(workerId) {
    const w = workerId === alternative?.id ? alternative : primary;
    setStage("confirming"); setError(null);
    try {
      const r = await fetch("/api/job/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, workerId: w.id, quotedPrice: w.quotedPrice }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); setStage("error"); return; }
      setConfirmed(d); setStage("done");
    } catch (err) { setError(String(err)); setStage("error"); }
  }

  function reset() {
    setText(""); setStage("input"); setUuid(null); setJob(null); setPrimary(null);
    setAlternative(null); setChat([]); setChatInput(""); setConfirmed(null); setError(null);
  }

  // ── INPUT ──
  if (stage === "input" || stage === "recommending") {
    return (
      <div className="hire-single">
        <form className="glass-card glass-card--accent" onSubmit={postJob} aria-busy={stage === "recommending"}>
          <div className="field">
            <label className="label" htmlFor="job">What do you need done?</label>
            <textarea id="job" className="textarea" placeholder="e.g. Fix my leaking kitchen sink urgently in Lahore" value={text} onChange={(e) => setText(e.target.value)} disabled={stage === "recommending"} rows={4} />
          </div>
          <div className="row gap-2 wrap" style={{ marginTop: "var(--s-3)" }}>
            {examples.map((ex) => (
              <button type="button" key={ex} className="chip" onClick={() => setText(ex)} disabled={stage === "recommending"}>
                {ex.length > 32 ? ex.slice(0, 32) + "…" : ex}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: "var(--s-4)" }} disabled={stage === "recommending" || !text.trim()}>
            {stage === "recommending" ? (<><span className="spinner" /> Finding the best worker…</>) : "Get recommendation"}
          </button>
          <p className="hint center" style={{ marginTop: "var(--s-3)" }}>
            No payment yet — the agent recommends first. Escrow locks only when you confirm.
          </p>
        </form>
      </div>
    );
  }

  // ── DONE ──
  if (stage === "done" && confirmed) {
    return (
      <div className="hire-single animate-in">
        <div className="glass-card glass-card--accent">
          <div className="center" style={{ marginBottom: "var(--s-4)" }}>
            <div className="postresult__orb" aria-hidden="true" style={{ margin: "0 auto var(--s-3)" }}>✅</div>
            <h3>{confirmed.worker.name} is hired!</h3>
            <p className="muted" style={{ marginTop: 6 }}>Escrow locked on-chain{confirmed.emailed ? " · worker notified by email" : ""}.</p>
          </div>
          <div className="result__worker glass-card">
            <div className="wkr__avatar" aria-hidden="true">{confirmed.worker.emoji || confirmed.worker.name?.[0]}</div>
            <div className="stack"><strong>{confirmed.worker.name}</strong><span className="dim" style={{ fontSize: ".85rem" }}>{confirmed.worker.role}</span></div>
            <span className="pill is-success" style={{ marginLeft: "auto" }}><span className="mono">{confirmed.amount} STT</span></span>
          </div>
          <div className="row gap-2 wrap" style={{ marginTop: "var(--s-3)" }}>
            {confirmed.escrowTx?.url && <a className="tx-pill" href={confirmed.escrowTx.url} target="_blank" rel="noreferrer">🔒 Escrow tx ↗</a>}
            {confirmed.emailed && <span className="pill is-info">📧 Worker emailed</span>}
          </div>
          <div className="result__actions">
            <a className="btn btn-secondary btn-sm" href="/dashboard">Watch on dashboard →</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Post another job</button>
          </div>
          <p className="hint" style={{ marginTop: "var(--s-3)" }}>Job ID: <span className="mono">{uuid}</span></p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (stage === "error") {
    return (
      <div className="hire-single">
        <div className="glass-card animate-in">
          <div className="pill is-danger"><span aria-hidden="true">⚠</span> {error || "Something went wrong"}</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} style={{ marginTop: "var(--s-3)" }}>Start over</button>
        </div>
      </div>
    );
  }

  // ── RECOMMEND + NEGOTIATE ──
  return (
    <div className="postgrid">
      {/* Recommendations */}
      <div className="stack gap-4">
        {job?.summary && (
          <div className="glass-card" style={{ padding: "var(--s-3) var(--s-4)" }}>
            <span className="dim" style={{ fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Your job</span>
            <p style={{ marginTop: 4 }}>{job.summary}</p>
            <div className="row gap-2 wrap" style={{ marginTop: "var(--s-2)" }}>
              {job.category && <span className="chip">{job.category}</span>}
              {job.urgency && <span className="chip">{job.urgency}</span>}
              {job.location && <span className="chip">{job.location}</span>}
            </div>
          </div>
        )}
        <RecCard worker={primary} badge="Top pick" onConfirm={() => confirm(primary.id)} busy={stage === "confirming"} />
        {alternative && <RecCard worker={alternative} badge="Cheaper option" subtle onConfirm={() => confirm(alternative.id)} busy={stage === "confirming"} />}
      </div>

      {/* Negotiation chat */}
      <div className="glass-card chat">
        <div className="chat__head"><span aria-hidden="true">💬</span> Chat with the agent</div>
        <div className="chat__body" ref={chatRef}>
          {chat.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.role}`}>{m.text}</div>
          ))}
          {chatBusy && <div className="bubble bubble--agent"><span className="spinner" style={{ width: 14, height: 14 }} /></div>}
          {stage === "confirming" && <div className="bubble bubble--agent"><span className="spinner" style={{ width: 14, height: 14 }} /> Locking escrow…</div>}
        </div>
        <form className="chat__input" onSubmit={sendChat}>
          <input className="input" placeholder="Too expensive? Ask why this one…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={chatBusy || stage === "confirming"} />
          <button type="submit" className="btn btn-primary" disabled={chatBusy || stage === "confirming" || !chatInput.trim()}>Send</button>
        </form>
        <p className="hint center">Confirm a worker above, or just tell the agent “go with the top pick”.</p>
      </div>
    </div>
  );
}

function agentIntro(d) {
  const p = d.primary;
  if (!p) return "I couldn't find a great match — try rephrasing your request.";
  let s = `I recommend ${p.name} (${p.role}) for this — ${p.why || "a strong fit"}. Quote: ${p.quotedPrice} STT.`;
  if (d.alternative) s += ` If budget's tight, ${d.alternative.name} is a cheaper option at ${d.alternative.quotedPrice} STT.`;
  s += " Want to go ahead, or have questions about price or quality?";
  return s;
}

function RecCard({ worker, badge, subtle, onConfirm, busy }) {
  if (!worker) return null;
  return (
    <article className={`glass-card ${subtle ? "" : "glass-card--accent"} rec`}>
      <div className="row gap-3">
        <div className="wkr__avatar" aria-hidden="true">{worker.emoji || worker.name?.[0]}</div>
        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap-2" style={{ justifyContent: "space-between" }}>
            <strong>{worker.name}</strong>
            <span className={`pill ${subtle ? "is-info" : "is-violet"}`} style={{ fontSize: ".68rem" }}>{badge}</span>
          </div>
          <span className="dim" style={{ fontSize: ".84rem" }}>{worker.role} · {worker.location}</span>
        </div>
      </div>
      {worker.why && <p className="muted" style={{ marginTop: "var(--s-2)", fontSize: ".92rem" }}>{worker.why}</p>}
      <div className="row gap-2 wrap" style={{ marginTop: "var(--s-2)" }}>
        {(worker.highlights || []).map((h, i) => <span className="chip" key={i}>{h}</span>)}
      </div>
      <div className="row gap-3" style={{ justifyContent: "space-between", marginTop: "var(--s-3)", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{worker.quotedPrice} STT</span>
        <button type="button" className={`btn ${subtle ? "btn-secondary" : "btn-primary"} btn-sm`} onClick={onConfirm} disabled={busy}>
          {busy ? <span className="spinner" /> : `Hire ${worker.name?.split(" ")[0]}`}
        </button>
      </div>
    </article>
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
