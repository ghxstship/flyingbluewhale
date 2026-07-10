import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  effectiveAccreditationState,
  type AccreditationState,
  type Certification,
  type CertificationHolder,
} from "@/lib/legend_compliance";
import { RecertButton } from "./RecertButton";

export const dynamic = "force-dynamic";

/**
 * /legend/certifications — the learner's credential wallet. Each holding
 * shows its live `accreditation_state` (tone-colored), expiry, and a recert
 * request control once it's expiring/expired. The certify→recert tail of the
 * learning arc.
 */
export default async function CertificationsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Learning" title="Certifications" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();

  const [{ data: holderData }, { data: certData }] = await Promise.all([
    db
      .from("certification_holders")
      .select("id, org_id, certification_id, user_id, source_course_id, issued_at, expires_on, last_recert_at, next_recert_due, accreditation_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("legend_certifications")
      .select("id, org_id, code, name, description, validity_months, recert_window_days, certification_state")
      .eq("org_id", session.orgId)
      .eq("certification_state", "active")
      .is("deleted_at", null),
  ]);

  const certs = new Map(((certData ?? []) as Certification[]).map((c) => [c.id, c]));
  const holders = (holderData ?? []) as CertificationHolder[];

  return (
    <>
      <ModuleHeader eyebrow="LEG3ND · Learning" title="Certifications" subtitle="Your credentials, recert windows, and expiry." />
      {holders.length === 0 ? (
        <EmptyState
          title="No certifications yet"
          description="Pass a course assessment that grants a certification to start your wallet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {holders.map((h) => {
            const cert = certs.get(h.certification_id);
            const eff: AccreditationState = effectiveAccreditationState(h, cert?.recert_window_days ?? 30, now);
            const tone = ACCREDITATION_STATE_TONES[eff];
            const recertable = eff === "expiring" || eff === "expired";
            return (
              <div key={h.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--p-text-1)]">{cert?.name ?? "Certification"}</h3>
                  <Badge variant={tone}>{ACCREDITATION_STATE_LABELS[eff]}</Badge>
                </div>
                {cert?.code && <p className="font-mono text-xs text-[var(--p-text-3)]">{cert.code}</p>}
                <dl className="grid grid-cols-2 gap-1 text-xs text-[var(--p-text-2)]">
                  <dt>Issued</dt>
                  <dd className="text-right text-[var(--p-text-1)]">{h.issued_at.slice(0, 10)}</dd>
                  <dt>Expires</dt>
                  <dd className="text-right text-[var(--p-text-1)]">{h.expires_on ?? "Never"}</dd>
                  {h.next_recert_due && (
                    <>
                      <dt>Recert due</dt>
                      <dd className="text-right text-[var(--p-text-1)]">{h.next_recert_due}</dd>
                    </>
                  )}
                </dl>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/legend/certifications/${h.id}`}
                    className="text-xs font-semibold text-[var(--p-accent-text)] hover:underline"
                  >
                    View certificate
                  </Link>
                  <Link
                    href={`/legend/certifications/${h.id}/verify`}
                    className="text-xs font-semibold text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                  >
                    Verification record
                  </Link>
                  {recertable && <RecertButton holderId={h.id} label="Request recert" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
