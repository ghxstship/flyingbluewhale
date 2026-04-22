import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Whitelist `next` to same-origin relative paths — matches the validator in
// /api/v1/auth/oauth so the full OAuth round-trip can't be turned into an
// open-redirect by crafting the return URL.
const NextSchema = z
  .string()
  .regex(/^\/(?!\/)[\w\-./?&=%#]{0,512}$/, "must be a same-origin path")
  .default("/auth/resolve");

/**
 * OAuth callback — Supabase redirects here with `?code=...` after the provider
 * (Google, GitHub, Microsoft) completes the consent dance. We exchange the
 * code for a session cookie via Supabase SSR, then forward to /auth/resolve
 * (or the validated `next` path) which dispatches to the correct shell based
 * on persona.
 *
 * Supabase provider config lives in the dashboard (Authentication → Providers).
 * The code-exchange is cookie-based; the session lands in the same @supabase/ssr
 * cookie jar every server component reads.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const nextParsed = NextSchema.safeParse(url.searchParams.get("next") ?? "/auth/resolve");
  const next = nextParsed.success ? nextParsed.data : "/auth/resolve";

  // Provider bounced us with an error (user denied, provider disabled, etc).
  if (errorParam) {
    const message = errorDescription ?? errorParam;
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
