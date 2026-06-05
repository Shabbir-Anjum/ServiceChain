"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../AuthProvider";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMOJIS = ["🔧", "⚡", "🧹", "🎨", "🪚", "❄️", "🌿", "📦", "💻", "🛠️"];

export default function ProfileSetup() {
  const router = useRouter();
  const { user, profile, loading, reloadProfile } = useAuth();

  const [form, setForm] = useState({
    full_name: "", job_role: "", emoji: "🛠️", wallet: "", hourly_rate: "",
    skills: "", location: "", bio: "", available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    hours_from: "09:00", hours_to: "17:00",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Prefill from existing profile.
  useEffect(() => {
    if (!user) return;
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      const p = d.profile || {};
      setForm((f) => ({
        ...f,
        full_name: p.full_name || "",
        job_role: p.job_role || "",
        emoji: p.emoji || "🛠️",
        wallet: p.wallet || "",
        hourly_rate: p.hourly_rate || "",
        skills: Array.isArray(p.skills) ? p.skills.join(", ") : "",
        location: p.location || "",
        bio: p.bio || "",
        available_days: p.available_days?.length ? p.available_days : f.available_days,
        hours_from: (p.hours_from || "09:00").slice(0, 5),
        hours_to: (p.hours_to || "17:00").slice(0, 5),
      }));
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, [user]);

  if (loading) return <section className="container section"><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></section>;

  if (!user) {
    return <Gate emoji="🔐" title="Log in to set up your profile" cta={{ href: "/login?next=/profile/setup", label: "Log in →" }} />;
  }
  if (profile && profile.role !== "worker" && profile.role !== "admin") {
    return <Gate emoji="🙋" title="Profile setup is for workers" body={`You're a ${profile.role} — no setup needed.`} cta={{ href: "/dashboard", label: "Go to dashboard →" }} />;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleDay = (d) => setForm((f) => ({ ...f, available_days: f.available_days.includes(d) ? f.available_days.filter((x) => x !== d) : [...f.available_days, d] }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.error) { setMsg({ type: "err", text: d.error }); }
      else {
        await reloadProfile?.();
        if (d.profile?.profile_complete) {
          setMsg({ type: "ok", text: "Profile complete — you're now live in the marketplace!" });
          setTimeout(() => { router.push("/worker"); router.refresh(); }, 900);
        } else {
          setMsg({ type: "warn", text: "Saved. Fill all required fields (wallet, rate, role, ≥1 skill, days, hours) to go live." });
        }
      }
    } catch (err) { setMsg({ type: "err", text: String(err) }); }
    finally { setBusy(false); }
  }

  const complete = profile?.profile_complete;

  return (
    <section className="container section" style={{ maxWidth: 720, marginInline: "auto" }}>
      <div className="center" style={{ marginBottom: "var(--s-5)" }}>
        <span className="eyebrow">Worker profile</span>
        <h2>{complete ? "Edit your profile" : "Complete your profile"}</h2>
        <p className="muted" style={{ maxWidth: 520, margin: "var(--s-2) auto 0" }}>
          {complete ? "Update your details anytime." : "Add your payout wallet, rate and availability so the AI agent can hire you."}
        </p>
        {!complete && (
          <span className="pill is-pending" style={{ marginTop: "var(--s-3)" }}><span className="dot" aria-hidden="true" /> Not live yet — finish setup</span>
        )}
      </div>

      <form className="glass-card glass-card--accent stack gap-4" onSubmit={save} aria-busy={busy}>
        <div className="row gap-3 wrap">
          <div className="field" style={{ flex: 2, minWidth: 180 }}>
            <label className="label">Display name</label>
            <input className="input" value={form.full_name} onChange={set("full_name")} placeholder="Your name" required />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Job role</label>
            <input className="input" value={form.job_role} onChange={set("job_role")} placeholder="Plumber" required />
          </div>
        </div>

        <div className="field">
          <span className="label">Avatar</span>
          <div className="row gap-2 wrap">
            {EMOJIS.map((em) => (
              <button type="button" key={em} className={`emoji-pick ${form.emoji === em ? "is-active" : ""}`} onClick={() => setForm((f) => ({ ...f, emoji: em }))} aria-pressed={form.emoji === em}>{em}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Payout wallet (Somnia / EVM address)</label>
          <input className="input mono" value={form.wallet} onChange={set("wallet")} placeholder="0x…40 hex chars" />
          <p className="hint">Released STT payments are sent here. Must be a valid 0x address.</p>
        </div>

        <div className="row gap-3 wrap">
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Hourly rate (STT)</label>
            <input className="input" type="number" min="0" step="1" value={form.hourly_rate} onChange={set("hourly_rate")} placeholder="20" />
          </div>
          <div className="field" style={{ flex: 2, minWidth: 180 }}>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={set("location")} placeholder="Lahore" />
          </div>
        </div>

        <div className="field">
          <label className="label">Skills (comma-separated)</label>
          <input className="input" value={form.skills} onChange={set("skills")} placeholder="plumbing, general, drainage" />
        </div>

        <div className="field">
          <label className="label">Bio / tagline</label>
          <input className="input" value={form.bio} onChange={set("bio")} placeholder="Leak-free guarantee. Same-day callouts." />
        </div>

        <div className="field">
          <span className="label">Available days</span>
          <div className="row gap-2 wrap">
            {DAYS.map((d) => (
              <button type="button" key={d} className={`chip ${form.available_days.includes(d) ? "chip--on" : ""}`} onClick={() => toggleDay(d)} aria-pressed={form.available_days.includes(d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="row gap-3 wrap">
          <div className="field" style={{ flex: 1, minWidth: 130 }}>
            <label className="label">Hours from</label>
            <input className="input" type="time" value={form.hours_from} onChange={set("hours_from")} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 130 }}>
            <label className="label">Hours to</label>
            <input className="input" type="time" value={form.hours_to} onChange={set("hours_to")} />
          </div>
        </div>

        {msg && <div className={`pill ${msg.type === "ok" ? "is-success" : msg.type === "warn" ? "is-pending" : "is-danger"}`}>{msg.text}</div>}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy || !hydrated}>
          {busy ? <><span className="spinner" /> Saving…</> : complete ? "Save changes" : "Save & go live"}
        </button>
      </form>
    </section>
  );
}

function Gate({ emoji, title, body, cta }) {
  return (
    <section className="container section">
      <div className="glass-card glass-card--accent gate">
        <div className="gate__orb" aria-hidden="true">{emoji}</div>
        <h3>{title}</h3>
        {body && <p className="muted" style={{ marginTop: "var(--s-2)" }}>{body}</p>}
        <a href={cta.href} className="btn btn-primary" style={{ marginTop: "var(--s-4)" }}>{cta.label}</a>
      </div>
    </section>
  );
}
