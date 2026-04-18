import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["google", "github", "azure"]);

/**
 * Initiates Supabase OAuth — redirects to provider, then back to /auth/callback.
 * If a provider is disabled in Supabase Auth, we surface a clean error toast on return.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const provider = url.searchParams.get("provider");
  const next = url.searchParams.get("next") ?? "/me";

  if (!provider || !ALLOWED.has(provider)) {
    return NextResponse.redirect(new URL(`/login?error=invalid_provider`, url));
  }

  const supabase = await createClient();
  const redirectTo = new URL(`/auth/callback?next=${encodeURIComponent(next)}`, url).toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "github" | "azure",
    options: { redirectTo },
  });

  if (error || !data.url) {
    const message = error?.message ?? "OAuth provider not configured";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, url));
  }

  return NextResponse.redirect(data.url);
}
