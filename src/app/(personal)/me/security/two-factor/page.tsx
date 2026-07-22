import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getEnrolledFactors, requireMfaFor } from "@/lib/auth/mfa";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { TwoFactorClient } from "./TwoFactorClient";

export const metadata = {
  title: "Two-Factor Authentication",
};

export default async function TwoFactorPage() {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login?next=/me/security/two-factor"));

  const { t } = await getRequestT();
  const factors = await getEnrolledFactors(session.userId);
  const totpFactors = factors.filter((f) => f.factorType === "totp");
  const required = await requireMfaFor(session.orgId, session.role);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="eyebrow eyebrow-accent">
        {t("me.security.twoFactor.eyebrow", undefined, "Account · Security")}
      </div>
      <h1 className="mt-3">
        {t("me.security.twoFactor.title", undefined, "Two-Factor Authentication")}
      </h1>
      <p className="mt-3 max-w-prose text-sm text-[var(--p-text-2)]">
        {t(
          "me.security.twoFactor.intro",
          undefined,
          "Add a second factor — a six-digit code from an authenticator app — so a stolen password isn't enough to sign in.",
        )}{" "}
        {required
          ? t("me.security.twoFactor.requiredNote", undefined, "Your organization requires this for your role.")
          : t("me.security.twoFactor.recommendedNote", undefined, "Recommended for everyone with admin access.")}
      </p>

      <div className="mt-8">
        <TwoFactorClient
          initialFactors={totpFactors.map((f) => ({
            id: f.id,
            status: f.status,
            friendlyName: f.friendlyName,
            createdAt: f.createdAt,
          }))}
        />
      </div>

      <div className="mt-8 text-xs text-[var(--p-text-2)]">
        <Link href="/me/security" className="underline underline-offset-4">
          {t("me.security.twoFactor.backToSecurity", undefined, "Back to security")}
        </Link>
      </div>
    </div>
  );
}
