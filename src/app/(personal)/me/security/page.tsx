import Link from "next/link";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth";
import { getEnrolledFactors } from "@/lib/auth/mfa";
import { getRequestT } from "@/lib/i18n/request";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { PasskeyManager } from "./PasskeyManager";

export default async function SecurityPage() {
  const { t } = await getRequestT();
  const session = await getSession();
  const factors = session ? await getEnrolledFactors(session.userId) : [];
  const verifiedTotp = factors.find((f) => f.factorType === "totp" && f.status === "verified");

  // Count remaining recovery codes (used_at IS NULL) so the row can show "n
  // remaining". This is a service-role read; if the key isn't configured we
  // simply hide the count.
  let recoveryRemaining: number | null = null;
  if (session && verifiedTotp && isServiceClientAvailable()) {
    type CountClient = {
      from: (table: "mfa_recovery_codes") => {
        select: (
          cols: string,
          opts: { count: "exact"; head: true },
        ) => {
          eq: (
            col: string,
            val: string,
          ) => {
            is: (col: string, val: null) => Promise<{ count: number | null; error: { message: string } | null }>;
          };
        };
      };
    };
    const admin = createServiceClient() as unknown as CountClient;
    const { count } = await admin
      .from("mfa_recovery_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .is("used_at", null);
    recoveryRemaining = count ?? 0;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--p-accent)] uppercase">
        {t("me.security.eyebrow", undefined, "Account")}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("me.security.title", undefined, "Security")}</h1>

      <div className="surface mt-8 divide-y divide-[var(--p-border)]">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">{t("me.security.password.label", undefined, "Password")}</div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {t("me.security.password.hint", undefined, "Last changed when you signed up")}
            </div>
          </div>
          <Button href="/forgot-password" variant="secondary">
            {t("me.security.password.reset", undefined, "Reset")}
          </Button>
        </div>

        <Link
          href="/me/security/two-factor"
          className="flex items-center justify-between p-5 hover:bg-[var(--p-surface-2)]"
        >
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--p-text-2)]" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {t("me.security.totp.label", undefined, "Authenticator app")}
              </span>
              <Badge variant={verifiedTotp ? "success" : "warning"}>
                {verifiedTotp
                  ? t("me.security.totp.active", undefined, "Active")
                  : t("me.security.totp.inactive", undefined, "Not configured")}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {verifiedTotp
                ? t("me.security.totp.enabledHint", undefined, "TOTP second factor enabled.")
                : t("me.security.totp.setupHint", undefined, "Add a six-digit code from an authenticator app.")}
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
        </Link>

        {verifiedTotp && (
          <Link
            href="/me/security/two-factor"
            className="flex items-center justify-between p-5 hover:bg-[var(--p-surface-2)]"
          >
            <div>
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-[var(--p-text-2)]" aria-hidden="true" />
                <span className="text-sm font-semibold">
                  {t("me.security.recovery.label", undefined, "Recovery codes")}
                </span>
                {recoveryRemaining !== null && (
                  <Badge variant={recoveryRemaining > 0 ? "muted" : "warning"}>
                    {t(
                      "me.security.recovery.remaining",
                      { count: recoveryRemaining },
                      `${recoveryRemaining} remaining`,
                    )}
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t(
                  "me.security.recovery.hint",
                  undefined,
                  "Single-use codes for when you lose access to your authenticator.",
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
          </Link>
        )}

        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-semibold">{t("me.security.sessions.label", undefined, "Active Sessions")}</div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {t("me.security.sessions.hint", undefined, "Sign out of all other devices")}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="ps-btn ps-btn--danger ps-btn--sm">
              {t("me.security.sessions.signOutAll", undefined, "Sign out everywhere")}
            </button>
          </form>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{t("me.security.apiTokens.label", undefined, "API tokens")}</span>
              <Badge variant="muted">{t("me.security.apiTokens.badge", undefined, "On the Roadmap")}</Badge>
            </div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "me.security.apiTokens.hint",
                undefined,
                "Personal access tokens for the API. For now, sign in via the web UI; service-to-service calls use Supabase service-role keys server-side.",
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
          {t("me.security.passkeys.title", undefined, "Passkeys")}
        </h2>
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          {t(
            "me.security.passkeys.hint",
            undefined,
            "Passkeys are a phishing-resistant alternative to passwords. Add one for each device you sign in from.",
          )}
        </p>
        <div className="mt-4">
          <PasskeyManager />
        </div>
      </div>
    </div>
  );
}
