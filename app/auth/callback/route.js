// GET /auth/callback?code=... — Supabase redirects here after email confirm /
// magic link / OAuth. We exchange the code for a session (sets cookies) and then
// redirect the user to a clean URL (no ?code= left in the bar).
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the destination, stripping the code from the address bar.
  return NextResponse.redirect(new URL(next, url.origin));
}
