import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";

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

  const { t } = await getRequestT();
  return (
    <AuthShell
      title={t("auth.sso.errorTitle", undefined, "Couldn't start SSO")}
      subtitle={t("auth.sso.errorSubtitle", { provider }, `We couldn't redirect you to ${provider}.`)}
    >
      <Alert kind="error">{error?.message ?? t("auth.sso.noRedirect", undefined, "No redirect URL returned.")}</Alert>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        {t(
          "auth.sso.body",
          undefined,
          "Make sure the provider is enabled for this workspace, or sign in with email instead.",
        )}
      </p>
      <a href="/login" className="btn btn-primary mt-4 w-full">
        {t("auth.forgotPassword.backToLogin", undefined, "Back to sign in")}
      </a>
    </AuthShell>
  );
}
