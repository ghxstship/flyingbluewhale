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
  RECERT_STATE_LABELS,
  effectiveAccreditationState,
  type AccreditationState,
  type Certification,
  type CertificationHolder,
  type RecertState,
} from "@/lib/legend_compliance";
import { canDecideRecert } from "@/lib/legend_recert";
import { RecertButton } from "./RecertButton";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/certifications — the learner's credential wallet. Each holding
 * shows its live `accreditation_state` (tone-colored), expiry, and a recert
 * request control once it's expiring/expired. The certify→recert tail of the
 * learning arc.
 */
export default async function CertificationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.certifications.eyebrow", undefined, "LEG3ND · Learning")}
          title={t("console.legend.certifications.title", undefined, "Certifications")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();

  const [{ data: holderData }, { data: certData }, { data: recertData }] = await Promise.all([
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
    // The caller's recert requests — the wallet renders their live state
    // (requested / in review / denied) so a request never silently vanishes.
    // select("*") tolerates the decision_note column pre-migration.
    db
      .from("certification_recerts")
      .select("*")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("submitted_at", { ascending: false }),
  ]);

  const certs = new Map(((certData ?? []) as Certification[]).map((c) => [c.id, c]));
  const holders = (holderData ?? []) as CertificationHolder[];
  // Latest request per holding (rows arrive newest-first).
  type MyRecert = { holder_id: string; recert_state: RecertState; decision_note?: string | null };
  const latestRecert = new Map<string, MyRecert>();
  for (const r of (recertData ?? []) as MyRecert[]) {
    if (!latestRecert.has(r.holder_id)) latestRecert.set(r.holder_id, r);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.certifications.eyebrow", undefined, "LEG3ND · Learning")}
        title={t("console.legend.certifications.title", undefined, "Certifications")}
        subtitle={t("console.legend.certifications.subtitle", undefined, "Your credentials, recert windows, and expiry.")}
      />
      {holders.length === 0 ? (
        <EmptyState
          title={t("console.legend.certifications.emptyTitle", undefined, "No certifications yet")}
          description={t(
            "console.legend.certifications.emptyDescription",
            undefined,
            "Pass a course assessment that grants a certification to start your wallet.",
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {holders.map((h) => {
            const cert = certs.get(h.certification_id);
            const eff: AccreditationState = effectiveAccreditationState(h, cert?.recert_window_days ?? 30, now);
            const tone = ACCREDITATION_STATE_TONES[eff];
            const myRecert = latestRecert.get(h.id);
            const recertPending = myRecert ? canDecideRecert(myRecert.recert_state) : false;
            const recertDenied = myRecert?.recert_state === "rejected";
            const recertable = (eff === "expiring" || eff === "expired") && !recertPending;
            return (
              <div key={h.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--p-text-1)]">
                    {cert?.name ?? t("console.legend.certifications.certification", undefined, "Certification")}
                  </h3>
                  <Badge variant={tone}>{ACCREDITATION_STATE_LABELS[eff]}</Badge>
                </div>
                {cert?.code && <p className="font-mono text-xs text-[var(--p-text-3)]">{cert.code}</p>}
                <dl className="grid grid-cols-2 gap-1 text-xs text-[var(--p-text-2)]">
                  <dt>{t("console.legend.certifications.issued", undefined, "Issued")}</dt>
                  <dd className="text-right text-[var(--p-text-1)]">{h.issued_at.slice(0, 10)}</dd>
                  <dt>{t("console.legend.certifications.expires", undefined, "Expires")}</dt>
                  <dd className="text-right text-[var(--p-text-1)]">
                    {h.expires_on ?? t("console.legend.certifications.never", undefined, "Never")}
                  </dd>
                  {h.next_recert_due && (
                    <>
                      <dt>{t("console.legend.certifications.recertDue", undefined, "Recert due")}</dt>
                      <dd className="text-right text-[var(--p-text-1)]">{h.next_recert_due}</dd>
                    </>
                  )}
                </dl>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/legend/certifications/${h.id}`}
                    className="text-xs font-semibold text-[var(--p-accent-text)] hover:underline"
                  >
                    {t("console.legend.certifications.viewCertificate", undefined, "View certificate")}
                  </Link>
                  <Link
                    href={`/legend/certifications/${h.id}/verify`}
                    className="text-xs font-semibold text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                  >
                    {t("console.legend.certifications.verificationRecord", undefined, "Verification record")}
                  </Link>
                  {recertPending && myRecert && (
                    <Badge variant="info">
                      {t(
                        "console.legend.certifications.recertState",
                        { state: RECERT_STATE_LABELS[myRecert.recert_state] },
                        `Recert: ${RECERT_STATE_LABELS[myRecert.recert_state]}`,
                      )}
                    </Badge>
                  )}
                  {recertDenied && myRecert && (
                    <Badge variant="error">
                      {myRecert.decision_note
                        ? t(
                            "console.legend.certifications.recertDeniedNote",
                            { note: myRecert.decision_note },
                            `Recert denied: ${myRecert.decision_note}`,
                          )
                        : t("console.legend.certifications.recertDenied", undefined, "Recert denied")}
                    </Badge>
                  )}
                  {recertable && (
                    <RecertButton
                      holderId={h.id}
                      label={t("console.legend.certifications.requestRecert", undefined, "Request recert")}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
