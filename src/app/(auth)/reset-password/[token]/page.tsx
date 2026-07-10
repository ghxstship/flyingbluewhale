import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";

import type { Metadata } from "next";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.resetPassword.pageTitle", undefined, "Set a New Password") };
}

/**
 * Direct recovery-token landing. Supabase normally bounces password-reset
 * clicks through /auth/callback?code=... → /reset-password — this route
 * is a fallback for older email templates that point straight here.
 *
 * verifyOtp(type: 'recovery') exchanges the token for a transient recovery
 * session; the user can then change their password on /reset-password.
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });

  if (!error) {
    redirect("/reset-password");
  }

  const { t } = await getRequestT();
  return (
    <AuthShell
      title={t("auth.resetPassword.expiredTitle", undefined, "Reset link expired")}
      subtitle={t("auth.resetPassword.expiredSubtitle", undefined, "We couldn't open your password-reset session.")}
    >
      <Alert kind="error">{error.message}</Alert>
      <p className="mt-4 text-sm text-[var(--p-text-2)]">
        {t(
          "auth.resetPassword.expiredBody",
          undefined,
          "Reset links expire after 24 hours. Request a fresh one to continue.",
        )}
      </p>
      <a href="/forgot-password" className="ps-btn mt-4 w-full">
        {t("auth.resetPassword.requestNew", undefined, "Request a new reset link")}
      </a>
    </AuthShell>
  );
}
