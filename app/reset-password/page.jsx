"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

// Set a new password. Reached from the email recovery link:
// /auth/callback exchanges the code for a session, then forwards here. So by the
// time this loads the user has a valid (recovery) session and updateUser() works.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Guard: only show the form if the recovery session is present.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(!!data?.session);
      setChecking(false);
    });
    return () => { active = false; };
  }, [supabase]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Send them to the app shortly after the success message.
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1500);
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
          <h2 style={{ margin: 0 }}>Set a new password</h2>
          <p className="muted" style={{ marginTop: 6 }}>Choose a strong password you haven't used before</p>
        </div>

        {checking ? (
          <div className="center" style={{ padding: "var(--s-5)" }}><span className="spinner" /> Checking your reset link…</div>
        ) : !hasSession ? (
          <div className="stack gap-4">
            <div className="pill is-danger"><span aria-hidden="true">⚠</span> This reset link is invalid or has expired.</div>
            <button type="button" className="btn btn-primary btn-block" onClick={() => router.push("/login")}>
              Request a new link
            </button>
          </div>
        ) : done ? (
          <div className="stack gap-4">
            <div className="pill is-info">✓ Password updated. Redirecting you in…</div>
          </div>
        ) : (
          <form onSubmit={submit} aria-busy={busy} className="stack gap-4">
            <div className="field">
              <label className="label" htmlFor="password">New password</label>
              <div className="pw-wrap">
                <input id="password" type={showPw ? "text" : "password"} className="input pw-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="new-password" />
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
            </div>
            <div className="field">
              <label className="label" htmlFor="confirm">Confirm new password</label>
              <input id="confirm" type={showPw ? "text" : "password"} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="new-password" />
            </div>

            {error && <div className="pill is-danger"><span aria-hidden="true">⚠</span> {error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? <><span className="spinner" /> Updating…</> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
