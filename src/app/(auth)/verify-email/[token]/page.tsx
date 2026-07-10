import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { getRequestT } from "@/lib/i18n/request";

import type { Metadata } from "next";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.verifyEmail.pageTitle", undefined, "Verify Your Email") };
}

/**
 * Direct email-confirmation landing. Same pattern as /magic-link/[token] —
 * a fallback for legacy email templates that embed the token in the URL.
 * Supabase's modern flow uses /auth/callback?code=...
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });

  if (!error) {
    redirect("/auth/resolve");
  }

  const { t } = await getRequestT();
  return (
    <AuthShell
      title={t("auth.verifyEmail.failedTitle", undefined, "Verification failed")}
      subtitle={t("auth.verifyEmail.failedSubtitle", undefined, "We couldn't verify your email with that link.")}
    >
      <Alert kind="error">{error.message}</Alert>
      <p className="mt-4 text-sm text-[var(--p-text-2)]">
        {t(
          "auth.verifyEmail.failedBody",
          undefined,
          "Verification links expire after 24 hours. Request a fresh one from the verify-email page.",
        )}
      </p>
      <Link href="/verify-email" className="ps-btn mt-4 w-full">
        {t("auth.verifyEmail.resend", undefined, "Resend verification email")}
      </Link>
    </AuthShell>
  );
}
