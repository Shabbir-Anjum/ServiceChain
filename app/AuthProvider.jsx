"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";

const AuthCtx = createContext({ user: null, profile: null, loading: true, signOut: async () => {} });

export function useAuth() {
  return useContext(AuthCtx);
}

export default function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (u) => {
      if (!u) { setProfile(null); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, job_role, profile_complete")
        .eq("id", u.id)
        .maybeSingle();
      setProfile(data || null);
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data?.user || null);
      await loadProfile(data?.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user || null);
      await loadProfile(session?.user);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, supabase, signOut, reloadProfile: () => loadProfile(user) }}>
      {children}
    </AuthCtx.Provider>
  );
}
