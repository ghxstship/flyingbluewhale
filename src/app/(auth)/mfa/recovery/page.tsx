import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.mfaRecovery.pageTitle", undefined, "Recovery Code Accepted") };
}

/**
 * E-27: interstitial after a recovery-code sign-in. The recovery path
 * consumes the code but cannot elevate the session to aal2 (Supabase has no
 * server-side AAL elevation for recovery codes), so the user is routed to
 * re-enroll — this page explains WHY before they land on an enrollment
 * screen that would otherwise look like an error.
 */
export default async function MfaRecoveryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { t } = await getRequestT();

  return (
    <AuthShell
      title={t("auth.mfaRecovery.title", undefined, "Recovery code accepted")}
      subtitle={t("auth.mfaRecovery.subtitle", undefined, "You're signed in. One more step to secure your account.")}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-4">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[var(--p-warning-text)]" aria-hidden="true" />
          <div className="space-y-2 text-sm text-[var(--p-text-2)]">
            <p>
              {t(
                "auth.mfaRecovery.explainConsumed",
                undefined,
                "Your recovery code worked and has now been used up. Each code is single-use.",
              )}
            </p>
            <p>
              {t(
                "auth.mfaRecovery.explainReEnroll",
                undefined,
                "Recovery codes can't stand in for your authenticator long term, so this session runs at reduced assurance. Set up a new authenticator now (or remove the lost one) to restore full two-factor protection and generate fresh recovery codes.",
              )}
            </p>
          </div>
        </div>
        <Button href="/me/security/two-factor?recovery=1" size="lg" className="w-full">
          {t("auth.mfaRecovery.cta", undefined, "Set up a new authenticator")}
        </Button>
        <p className="text-center text-xs text-[var(--p-text-3)]">
          {t(
            "auth.mfaRecovery.skipHint",
            undefined,
            "If you still have your authenticator, you can also just remove and re-add it from the same screen.",
          )}
        </p>
      </div>
    </AuthShell>
  );
}
