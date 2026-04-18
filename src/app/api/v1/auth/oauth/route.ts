import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ProviderSchema = z.enum(["google", "github", "azure"]);
// `next` MUST be a same-origin relative path — anything else is an open-redirect
// vector once the OAuth round-trip finishes. Accept only paths that start with a
// single slash and don't contain a scheme or protocol-relative prefix (//evil).
const NextSchema = z
  .string()
  .regex(/^\/(?!\/)[\w\-./?&=%#]{0,512}$/, "must be a same-origin path")
  .default("/me");

/**
 * Initiates Supabase OAuth — redirects to provider, then back to /auth/callback.
 * If a provider is disabled in Supabase Auth, we surface a clean error toast on return.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const providerParsed = ProviderSchema.safeParse(url.searchParams.get("provider"));
  if (!providerParsed.success) {
    return NextResponse.redirect(new URL(`/login?error=invalid_provider`, url));
  }
  const provider = providerParsed.data;

  const nextParsed = NextSchema.safeParse(url.searchParams.get("next") ?? "/me");
  const next = nextParsed.success ? nextParsed.data : "/me";

  const supabase = await createClient();
  const redirectTo = new URL(`/auth/callback?next=${encodeURIComponent(next)}`, url).toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error || !data.url) {
    const message = error?.message ?? "OAuth provider not configured";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, url));
  }

  return NextResponse.redirect(data.url);
}
