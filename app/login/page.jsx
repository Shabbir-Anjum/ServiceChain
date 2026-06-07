"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("client");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const next = params.get("next") || "/dashboard";
  // Workers go set up their profile first; clients go to their destination.
  const dest = role === "worker" ? "/profile/setup" : next;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else if (mode === "forgot") {
        // Email a recovery link. It lands on /auth/callback, which exchanges the
        // code for a session and forwards to /reset-password to set a new one.
        const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setNotice("If an account exists for that email, a password-reset link is on its way. Check your inbox.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });
        if (error) throw error;
        // If email confirmation is off, a session is returned immediately.
        if (data.session) {
          router.push(dest);
          router.refresh();
        } else {
          setNotice("Account created. If email confirmation is on, check your inbox — otherwise just log in.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section auth">
      <div className="glass-card glass-card--accent auth__card">
        <div className="center" style={{ marginBottom: "var(--s-5)" }}>
          <div className="postresult__orb" aria-hidden="true" style={{ margin: "0 auto var(--s-3)" }}>✦</div>
          <h2 style={{ margin: 0 }}>{mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset your password" : "Create your account"}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {mode === "login" ? "Log in to ServiceChain" : mode === "forgot" ? "Enter your email and we'll send a reset link" : "Join as a client or a worker"}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="auth__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "login"} className={`auth__tab ${mode === "login" ? "is-active" : ""}`} onClick={() => { setMode("login"); setError(null); setNotice(null); }}>Log in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={`auth__tab ${mode === "signup" ? "is-active" : ""}`} onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>Sign up</button>
          </div>
        )}

        <form onSubmit={submit} aria-busy={busy} className="stack gap-4" style={{ marginTop: "var(--s-4)" }}>
          {mode === "signup" && (
            <>
              <div className="field">
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="field">
                <span className="label">I am a…</span>
                <div className="auth__roles">
                  <RoleCard active={role === "client"} onClick={() => setRole("client")} emoji="🙋" title="Client" desc="Post jobs & hire" />
                  <RoleCard active={role === "worker"} onClick={() => setRole("worker")} emoji="🛠️" title="Worker" desc="Get hired & paid" />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          {mode !== "forgot" && (
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input id="password" type={showPw ? "text" : "password"} className="input pw-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw} title={showPw ? "Hide password" : "Show password"}>
                {showPw ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <button type="button" className="auth__link" onClick={() => { setMode("forgot"); setError(null); setNotice(null); }}>
                  Forgot password?
                </button>
              </div>
            )}
          </div>
          )}

          {error && <div className="pill is-danger"><span aria-hidden="true">⚠</span> {error}</div>}
          {notice && <div className="pill is-info">{notice}</div>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? <><span className="spinner" /> Please wait…</> : mode === "login" ? "Log in" : mode === "forgot" ? "Send reset link" : "Create account"}
          </button>
        </form>

        <p className="hint center" style={{ marginTop: "var(--s-4)" }}>
          {mode === "forgot" ? (
            <>
              Remembered it?{" "}
              <button type="button" className="auth__link" onClick={() => { setMode("login"); setError(null); setNotice(null); }}>
                Back to log in
              </button>
            </>
          ) : (
            <>
              {mode === "login" ? "New here? " : "Already have an account? "}
              <button type="button" className="auth__link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setNotice(null); }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function RoleCard({ active, onClick, emoji, title, desc }) {
  return (
    <button type="button" onClick={onClick} className={`auth__role ${active ? "is-active" : ""}`} aria-pressed={active}>
      <span className="auth__role-emoji" aria-hidden="true">{emoji}</span>
      <strong>{title}</strong>
      <span className="dim" style={{ fontSize: ".8rem" }}>{desc}</span>
    </button>
  );
}
