"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthProvider";
import { STEP_MAP, STATUS_PILL } from "../steps";

export default function AdminPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return <section className="container section"><div className="skeleton" style={{ height: 200, borderRadius: 16 }} /></section>;

  if (!user || profile?.role !== "admin") {
    return (
      <section className="container section">
        <div className="glass-card glass-card--accent gate">
          <div className="gate__orb" aria-hidden="true">⛔</div>
          <h3>Admins only</h3>
          <p className="muted" style={{ marginTop: "var(--s-2)" }}>
            {user ? `You're signed in as a ${profile?.role}. This area is restricted to admins.` : "Log in with an admin account to manage the platform."}
          </p>
          <a href={user ? "/dashboard" : "/login?next=/admin"} className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>{user ? "Go to dashboard →" : "Log in →"}</a>
        </div>
      </section>
    );
  }
  return <AdminConsole />;
}

function AdminConsole() {
  const [tab, setTab] = useState("jobs");
  return (
    <section className="container section">
      <div className="center" style={{ marginBottom: "var(--s-5)" }}>
        <span className="eyebrow">Admin console</span>
        <h2>Platform <span className="gradient-text">control</span></h2>
      </div>
      <div className="auth__tabs" style={{ maxWidth: 320, margin: "0 auto var(--s-6)" }}>
        <button type="button" className={`auth__tab ${tab === "jobs" ? "is-active" : ""}`} onClick={() => setTab("jobs")}>All jobs</button>
        <button type="button" className={`auth__tab ${tab === "workers" ? "is-active" : ""}`} onClick={() => setTab("workers")}>Workers</button>
      </div>
      {tab === "jobs" ? <AllJobs /> : <WorkersAdmin />}
    </section>
  );
}

function AllJobs() {
  const [jobs, setJobs] = useState(null);
  useEffect(() => {
    const tick = () => fetch("/api/status").then((r) => r.json()).then((d) => setJobs(d.jobs || [])).catch(() => {});
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  if (jobs === null) return <div className="job-grid">{[0, 1].map((i) => <div key={i} className="glass-card" style={{ height: 200 }}><div className="skeleton" style={{ height: "100%" }} /></div>)}</div>;
  if (jobs.length === 0) return <div className="glass-card empty-state"><div className="empty-state__orb" aria-hidden="true">✦</div><h3>No jobs yet</h3><p className="muted">Jobs from all clients will appear here.</p></div>;

  return (
    <div className="job-grid">
      {jobs.map((j) => {
        const pill = STATUS_PILL[j.status] || { cls: "is-info", label: j.status };
        return (
          <article key={j.uuid} className="glass-card job">
            <div className="job__head">
              <span className="job__summary clamp-2">{j.job?.summary || j.requestText}</span>
              <span className={`pill ${pill.cls}`}>{pill.label}</span>
            </div>
            <div className="job__meta">
              {j.worker && <><span aria-hidden="true">{j.worker.emoji}</span> {j.worker.name}</>}
              {j.amount != null && <> · <span className="mono">{j.amount} STT</span></>}
            </div>
            <ol className="timeline">
              {(j.steps || []).map((s, i) => {
                const meta = STEP_MAP[s.step] || { icon: "•", label: s.step, status: "info" };
                const cls = meta.status === "success" ? "is-success" : meta.status === "danger" ? "is-danger" : meta.status === "violet" ? "is-violet" : "";
                return (
                  <li key={i} className={`tl ${cls}`}>
                    <span className="tl__icon" aria-hidden="true">{meta.icon}</span>
                    <div className="tl__body">
                      <div className="row gap-2 wrap" style={{ justifyContent: "space-between" }}>
                        <span className="tl__label">{meta.label}</span>
                        {s.payload?.url && <a className="tx-pill" href={s.payload.url} target="_blank" rel="noreferrer">tx ↗</a>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </div>
  );
}

function WorkersAdmin() {
  const [workers, setWorkers] = useState(null);
  const [form, setForm] = useState({ email: "", name: "", role: "", emoji: "", skills: "", location: "", tagline: "", rating: "", wallet: "", hourlyRate: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    fetch("/api/admin/workers").then((r) => r.json()).then((d) => setWorkers(d.workers || [])).catch(() => setWorkers([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function addWorker(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/workers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.error) setMsg({ type: "err", text: d.error });
      else { setMsg({ type: "ok", text: `Invited ${d.worker.name}. Temp password: ${d.tempPassword}` }); setForm({ email: "", name: "", role: "", emoji: "", skills: "", location: "", tagline: "", rating: "", wallet: "", hourlyRate: "" }); load(); }
    } catch (err) { setMsg({ type: "err", text: String(err) }); }
    finally { setBusy(false); }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const complete = (workers || []).filter((w) => w.complete).length;

  return (
    <div className="admin__grid">
      <form className="glass-card glass-card--accent" onSubmit={addWorker} aria-busy={busy}>
        <h3 style={{ marginBottom: "var(--s-1)" }}>Invite a worker</h3>
        <p className="hint" style={{ marginBottom: "var(--s-3)" }}>Creates a worker account with a temp password. They can log in to edit their profile.</p>
        <div className="stack gap-3">
          <div className="field"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} placeholder="worker@email.com" required /></div>
          <div className="row gap-3">
            <div className="field" style={{ flex: 2 }}><label className="label">Name</label><input className="input" value={form.name} onChange={set("name")} placeholder="Full name" required /></div>
            <div className="field" style={{ width: 80 }}><label className="label">Emoji</label><input className="input" value={form.emoji} onChange={set("emoji")} placeholder="🛠️" /></div>
          </div>
          <div className="row gap-3">
            <div className="field" style={{ flex: 1 }}><label className="label">Role</label><input className="input" value={form.role} onChange={set("role")} placeholder="Plumber" required /></div>
            <div className="field" style={{ flex: 1 }}><label className="label">Location</label><input className="input" value={form.location} onChange={set("location")} placeholder="Lahore" /></div>
          </div>
          <div className="field"><label className="label">Skills (comma-separated)</label><input className="input" value={form.skills} onChange={set("skills")} placeholder="plumbing, general" /></div>
          <div className="field"><label className="label">Tagline</label><input className="input" value={form.tagline} onChange={set("tagline")} placeholder="Leak-free guarantee." /></div>
          <div className="row gap-3">
            <div className="field" style={{ width: 100 }}><label className="label">Rating</label><input className="input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={set("rating")} placeholder="4.8" /></div>
            <div className="field" style={{ width: 110 }}><label className="label">Rate (STT/h)</label><input className="input" type="number" value={form.hourlyRate} onChange={set("hourlyRate")} placeholder="20" /></div>
            <div className="field" style={{ flex: 1 }}><label className="label">Wallet</label><input className="input mono" value={form.wallet} onChange={set("wallet")} placeholder="0x…" /></div>
          </div>
        </div>
        {msg && <div className={`pill ${msg.type === "ok" ? "is-success" : "is-danger"}`} style={{ marginTop: "var(--s-3)" }}>{msg.text}</div>}
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "var(--s-4)" }} disabled={busy}>{busy ? <><span className="spinner" /> Inviting…</> : "Invite worker"}</button>
      </form>

      <div>
        <h3 style={{ marginBottom: "var(--s-3)" }}>Workers ({workers?.length ?? "…"} · {complete} live)</h3>
        {workers === null ? <div className="skeleton" style={{ height: 300, borderRadius: 16 }} /> : (
          <div className="stack gap-2" style={{ maxHeight: 540, overflow: "auto" }}>
            {workers.map((w) => (
              <div key={w.id} className="glass-card" style={{ padding: "var(--s-3)" }}>
                <div className="row gap-3">
                  <div className="wkr__avatar" aria-hidden="true">{w.emoji}</div>
                  <div className="stack" style={{ flex: 1, minWidth: 0 }}>
                    <strong>{w.name}</strong>
                    <span className="dim" style={{ fontSize: ".82rem" }}>{w.role || "—"} · {w.location || "—"} · ★ {w.rating}</span>
                  </div>
                  <span className={`pill ${w.complete ? "is-success" : "is-pending"}`} style={{ fontSize: ".68rem", flex: "none" }}>{w.complete ? "Live" : "Setup pending"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
