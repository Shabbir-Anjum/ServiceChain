// Auth helpers for route handlers + server components.
// Resolve the logged-in user and their profile (role + linked worker).
import { createClient } from "./supabase/server";

// Returns the authenticated user or null.
export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

// Returns { user, profile } where profile = { id, email, role, worker_id, full_name }.
// profile is null if not signed in.
export async function getAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user || null;
  if (!user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, worker_id")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile: profile || null, supabase };
}

// Throws-style guard for route handlers: returns { ok, status, profile, user }.
// Pass one or more allowed roles.
export async function requireRole(...roles) {
  const { user, profile, supabase } = await getAuth();
  if (!user) return { ok: false, status: 401, error: "Not signed in" };
  if (roles.length && !roles.includes(profile?.role)) {
    return { ok: false, status: 403, error: "Forbidden", profile, user };
  }
  return { ok: true, status: 200, user, profile, supabase };
}
