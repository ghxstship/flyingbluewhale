import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

const SUPPORTED_PROVIDERS = ["google", "github", "azure", "apple", "linkedin_oidc"] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

function isSupported(p: string): p is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(p);
}

/**
 * SSO entrypoint — `/sso/[provider]` initiates an OAuth handshake with the
 * named provider. Supabase generates the redirect URL; we forward the user
 * there. The provider then bounces back through /auth/callback?code=...
 *
 * `?next=...` is forwarded into the callback so the persona dispatcher can
 * route the user to the right destination after the round-trip.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { provider } = await params;
  const { next } = await searchParams;
  if (!isSupported(provider)) notFound();

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? "localhost"}`;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next ?? "/auth/resolve")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (!error && data?.url) {
    redirect(data.url);
  }

  return (
    <AuthShell title="Couldn't start SSO" subtitle={`We couldn't redirect you to ${provider}.`}>
      <Alert kind="error">{error?.message ?? "No redirect URL returned."}</Alert>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Make sure the provider is enabled for this workspace, or sign in with email instead.
      </p>
      <Button href="/login" className="mt-4 w-full">
        Back to sign in
      </Button>
    </AuthShell>
  );
}
