import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";
import { getActiveMsaForCrew } from "@/lib/msa/queries";
import { msaPublicUrl } from "@/lib/msa/format";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { BRAND } from "@/lib/brand";
import { UnlockForm } from "./UnlockForm";
import { ResponseForms } from "./ResponseForms";

export const dynamic = "force-dynamic";

/**
 * E-05: resolve the issuing org's lockup + support email by token alone (the
 * unlock screen renders before the access code exists). Only safe metadata —
 * org display name and support address — is exposed pre-unlock. Falls back to
 * the platform brand when the token doesn't resolve.
 */
async function getUnlockLockup(token: string): Promise<{ orgName: string; supportEmail: string }> {
  const fallback = { orgName: BRAND.legalName, supportEmail: BRAND.emails.support };
  if (!isServiceClientAvailable()) return fallback;
  try {
    const svc = createServiceClient() as unknown as LooseSupabase;
    const { data } = await svc
      .from("offer_letters")
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
  const code = c.get(`offer_${token}`)?.value;

  if (!code) {
    const lockup = await getUnlockLockup(token);
    return <UnlockForm token={token} orgName={lockup.orgName} supportEmail={lockup.supportEmail} />;
  }

  const letter = await getOfferLetterByToken(token, code);
  if (!letter || !letter.id) {
    const lockup = await getUnlockLockup(token);
    return <UnlockForm token={token} expired orgName={lockup.orgName} supportEmail={lockup.supportEmail} />;
  }

  const activeMsa = await getActiveMsaForCrew(letter.crew_member_id);
  const msaSignerUrl = activeMsa ? msaPublicUrl(activeMsa.public_token) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={STATUS_VARIANT[letter.status]}>{STATUS_LABEL[letter.status]}</Badge>
        <div className="flex items-center gap-3 text-xs">
          <a
            href={`/offer/${token}/print`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--border-default)] px-3 py-1.5 text-[var(--p-text-2)] hover:border-[var(--p-accent)] hover:text-[var(--p-accent)]"
          >
            Download PDF / Print
          </a>
          <span className="text-[var(--p-text-2)]">Reference · OL-{letter.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <LetterDocument letter={letter} activeMsa={activeMsa} msaSignerUrl={msaSignerUrl} />

      <ResponseForms token={token} status={letter.status} recipientName={letter.recipient_name} />
    </div>
  );
}
