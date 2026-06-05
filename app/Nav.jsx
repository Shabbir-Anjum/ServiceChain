"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const role = profile?.role;
  // Role-aware links.
  const links = [{ href: "/", label: "Home" }];
  if (role === "worker") links.push({ href: "/worker", label: "My jobs" });
  if (role === "worker") links.push({ href: "/profile/setup", label: "Profile" });
  if (user) links.push({ href: "/dashboard", label: "Dashboard" });
  if (role === "admin") links.push({ href: "/admin", label: "Admin" });

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a href="/" className="nav__brand" aria-label="ServiceChain home">
          <span className="nav__logo" aria-hidden="true">✦</span>
          <span className="nav__name">Service<span className="gradient-text">Chain</span></span>
        </a>

        <nav className={`nav__links ${open ? "is-open" : ""}`} aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <a key={l.href} href={l.href} className={`nav__link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                {l.label}
              </a>
            );
          })}

          {/* Auth area (also shown inside mobile menu) */}
          <div className="nav__auth-m">
            {!loading && !user && (
              <a href="/login" className="btn btn-primary btn-sm">Log in</a>
            )}
            {!loading && user && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSignOut}>Log out</button>
            )}
          </div>
        </nav>

        <div className="nav__right">
          {!loading && user && (
            <span className="nav__user" title={profile?.email || user.email}>
              <span className={`pill ${role === "admin" ? "is-violet" : role === "worker" ? "is-info" : "is-success"} nav__role`}>{role || "client"}</span>
              <span className="nav__email dim">{profile?.full_name || user.email?.split("@")[0]}</span>
            </span>
          )}
          {!loading && !user && (
            <a href="/login" className="btn btn-primary btn-sm nav__login">Log in</a>
          )}
          {!loading && user && (
            <button type="button" className="btn btn-ghost btn-sm nav__logout" onClick={handleSignOut}>Log out</button>
          )}
          <span className="pill is-success pill--live nav__status" title="Connected to Somnia Shannon testnet">
            <span className="dot" aria-hidden="true"></span>
            Somnia
          </span>
          <button type="button" className="nav__burger" aria-label="Toggle menu" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
