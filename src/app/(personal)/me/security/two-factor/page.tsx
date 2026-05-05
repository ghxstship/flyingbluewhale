import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getEnrolledFactors, requireMfaFor } from "@/lib/auth/mfa";
import { TwoFactorClient } from "./TwoFactorClient";

export const metadata = {
  title: "Two-Factor Authentication",
};

export default async function TwoFactorPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/me/security/two-factor");

  const factors = await getEnrolledFactors(session.userId);
  const totpFactors = factors.filter((f) => f.factorType === "totp");
  const required = await requireMfaFor(session.orgId, session.role);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
        Account · Security
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Two-Factor Authentication</h1>
      <p className="mt-3 max-w-prose text-sm text-[var(--text-secondary)]">
        Add a second factor — a six-digit code from an authenticator app — so a stolen password isn&apos;t enough to
        sign in.{" "}
        {required ? "Your organization requires this for your role." : "Recommended for everyone with admin access."}
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

      <div className="mt-8 text-xs text-[var(--text-muted)]">
        <Link href="/me/security" className="underline underline-offset-4">
          Back to security
        </Link>
      </div>
    </div>
  );
}
