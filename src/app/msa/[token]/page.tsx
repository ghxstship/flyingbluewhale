import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MSADocument } from "@/components/msa/MSADocument";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getMsaByToken } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { BRAND } from "@/lib/brand";
import { UnlockForm } from "./UnlockForm";
import { SignForm } from "./SignForm";

export const dynamic = "force-dynamic";

/**
 * E-05: resolve the issuing org's lockup + support email by token alone (the
 * unlock screen renders before the access code exists). Only safe metadata is
 * exposed pre-unlock; falls back to the platform brand.
 */
async function getUnlockLockup(token: string): Promise<{ orgName: string; supportEmail: string }> {
  const fallback = { orgName: BRAND.legalName, supportEmail: BRAND.emails.support };
  if (!isServiceClientAvailable()) return fallback;
  try {
    const svc = createServiceClient() as unknown as LooseSupabase;
    const { data } = await svc
      .from("independent_contractor_msas")
      .select("org:org_id(name, name_override, support_email)")
      .eq("public_token", token)
      .maybeSingle();
    const org = (data as { org?: { name: string; name_override: string | null; support_email: string | null } } | null)
      ?.org;
    if (!org) return fallback;
    return {
      orgName: org.name_override ?? org.name,
      supportEmail: org.support_email ?? BRAND.emails.support,
    };
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();

  const c = await cookies();
  const code = c.get(`msa_${token}`)?.value;

  if (!code) {
    const lockup = await getUnlockLockup(token);
    return <UnlockForm token={token} orgName={lockup.orgName} supportEmail={lockup.supportEmail} />;
  }

  const msa = await getMsaByToken(token, code);
  if (!msa || !msa.id) {
    const lockup = await getUnlockLockup(token);
    return <UnlockForm token={token} expired orgName={lockup.orgName} supportEmail={lockup.supportEmail} />;
  }

  const role = (msa.crew_member_role ?? "").toLowerCase();
  const showChapter624 =
    role.includes("carpentry") ||
    role.includes("electrical") ||
    role.includes("rigging") ||
    role.includes("steel") ||
    role.includes("heavy");

  const alreadySigned = msa.msa_state === "signed";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={MSA_STATUS_VARIANT[msa.msa_state]}>{MSA_STATUS_LABEL[msa.msa_state]}</Badge>
        <div className="flex items-center gap-3 text-xs">
          <a
            href={`/msa/${token}/print`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--p-border)] px-3 py-1.5 text-[var(--p-text-2)] hover:border-[var(--p-accent)] hover:text-[var(--p-accent)]"
          >
            Download PDF / Print
          </a>
          <span className="text-[var(--p-text-2)]">Reference · MSA-{msa.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <MSADocument msa={msa} orgName={msa.org_name} />

      {!alreadySigned && (
        <div className="space-y-3">
          <h2 className="eyebrow">Sign &amp; Submit</h2>
          <p className="text-sm text-[var(--p-text-2)]">
            Once signed, this Agreement applies to every engagement letter we issue you, until revoked or superseded.
            You won&rsquo;t be asked to re-sign this for future productions, just the engagement letter for each one.
          </p>
          <SignForm token={token} showChapter624={showChapter624} />
        </div>
      )}
    </div>
  );
}
