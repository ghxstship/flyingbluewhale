import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import {
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  RECERT_STATE_LABELS,
  effectiveAccreditationState,
  type Certification,
  type CertificationHolder,
  type RecertState,
} from "@/lib/legend_compliance";
import { canDecideRecert } from "@/lib/legend_recert";
import { getRequestT } from "@/lib/i18n/request";
import { DecideRecertButtons } from "./DecideRecertButtons";

export const dynamic = "force-dynamic";

type RecertRow = {
  id: string;
  holder_id: string;
  user_id: string;
  recert_state: RecertState;
  note: string | null;
  decision_note?: string | null;
  submitted_at: string;
  decided_at: string | null;
};

const RECERT_TONES: Record<RecertState, BadgeVariant> = {
  requested: "info",
  in_review: "warning",
  approved: "success",
  rejected: "error",
  completed: "success",
};

/**
 * /legend/compliance/recerts — the recert decision queue (L-P6b, blocker
 * B-3). `certification_recerts` was insert-only: learner requests vanished
 * into a dead letter. This is the manager surface that reads the queue and
 * decides it — approve renews the holding through the canonical issuance
 * path (same artifact the assessment pass created), deny records the reason.
 */
export default async function RecertQueuePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.compliance.recerts.eyebrow", undefined, "LEG3ND · Compliance")}
          title={t("console.legend.compliance.recerts.title", undefined, "Recert Queue")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/compliance" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();

  const [{ data: recertData }, members] = await Promise.all([
    db
      .from("certification_recerts")
      .select("*")
      .eq("org_id", session.orgId)
      .order("submitted_at", { ascending: false })
      .limit(200),
    listOrgMembers(session.orgId),
  ]);
  const recerts = (recertData ?? []) as RecertRow[];
  const memberById = new Map(members.map((m) => [m.id, m]));

  const holderIds = [...new Set(recerts.map((r) => r.holder_id))];
  const { data: holderData } = holderIds.length
    ? await db
        .from("certification_holders")
        .select(
          "id, org_id, certification_id, user_id, source_course_id, issued_at, expires_on, last_recert_at, next_recert_due, accreditation_state",
        )
        .eq("org_id", session.orgId)
        .in("id", holderIds)
    : { data: [] };
  const holders = new Map(((holderData ?? []) as CertificationHolder[]).map((h) => [h.id, h]));

  const certIds = [...new Set([...holders.values()].map((h) => h.certification_id))];
  const { data: certData } = certIds.length
    ? await db
        .from("legend_certifications")
        .select("id, org_id, code, name, description, validity_months, recert_window_days, certification_state")
        .eq("org_id", session.orgId)
        .in("id", certIds)
    : { data: [] };
  const certs = new Map(((certData ?? []) as Certification[]).map((c) => [c.id, c]));

  const pending = recerts.filter((r) => canDecideRecert(r.recert_state));
  const decided = recerts.filter((r) => !canDecideRecert(r.recert_state)).slice(0, 20);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.compliance.recerts.eyebrow", undefined, "LEG3ND · Compliance")}
        title={t("console.legend.compliance.recerts.title", undefined, "Recert Queue")}
        subtitle={t(
          "console.legend.compliance.recerts.subtitle",
          { n: String(pending.length) },
          `${pending.length} pending requests. Approve renews the certificate; deny records the reason.`,
        )}
        breadcrumbs={[
          { label: t("console.legend.certifications.definitions.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.compliance.title", undefined, "Recert Matrix"), href: "/legend/compliance" },
          { label: t("console.legend.compliance.recerts.breadcrumb", undefined, "Queue") },
        ]}
        action={
          <Link href="/legend/compliance" className="ps-btn ps-btn--secondary ps-btn--sm">
            {t("console.legend.compliance.recerts.matrixLink", undefined, "Recert Matrix")}
          </Link>
        }
      />

      {pending.length === 0 ? (
        <EmptyState
          title={t("console.legend.compliance.recerts.emptyTitle", undefined, "No pending recert requests")}
          description={t(
            "console.legend.compliance.recerts.emptyDescription",
            undefined,
            "When a credential holder requests recertification from their wallet, it lands here for a decision.",
          )}
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">{t("console.legend.compliance.recerts.col.requester", undefined, "Requester")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.compliance.recerts.col.credential", undefined, "Credential")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.compliance.recerts.col.holding", undefined, "Holding")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.compliance.recerts.col.expiry", undefined, "Expiry")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.compliance.recerts.col.submitted", undefined, "Submitted")}</th>
                <th className="px-3 py-2 text-right">{t("console.legend.compliance.recerts.col.decision", undefined, "Decision")}</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => {
                const holder = holders.get(r.holder_id);
                const cert = holder ? certs.get(holder.certification_id) : undefined;
                const member = memberById.get(r.user_id);
                const eff = holder
                  ? effectiveAccreditationState(holder, cert?.recert_window_days ?? 30, now)
                  : null;
                return (
                  <tr key={r.id} className="border-t border-[var(--p-border)] align-top">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <Avatar size="xs" name={member?.name ?? "?"} src={member?.avatar_url ?? undefined} />
                        <span className="text-[var(--p-text-1)]">{member?.name ?? r.user_id.slice(0, 8)}</span>
                      </span>
                      {r.note && <p className="mt-1 text-xs text-[var(--p-text-3)]">{r.note}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[var(--p-text-1)]">{cert?.name ?? "—"}</span>
                      {cert?.code && <span className="ml-1.5 font-mono text-xs text-[var(--p-text-3)]">{cert.code}</span>}
                    </td>
                    <td className="px-3 py-2">
                      {holder ? (
                        <span className="inline-flex items-center gap-1.5">
                          {eff && <Badge variant={ACCREDITATION_STATE_TONES[eff]}>{ACCREDITATION_STATE_LABELS[eff]}</Badge>}
                          <Link
                            href={`/legend/certifications/${holder.id}`}
                            className="text-xs font-semibold text-[var(--p-accent-text)] hover:underline"
                          >
                            {t("console.legend.compliance.recerts.certificate", undefined, "Certificate")}
                          </Link>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-[var(--p-text-2)]">
                      {holder?.expires_on ?? t("console.legend.certifications.never", undefined, "Never")}
                    </td>
                    <td className="px-3 py-2 text-[var(--p-text-2)]">{r.submitted_at.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right">
                      <DecideRecertButtons recertId={r.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.legend.compliance.recerts.recentDecisions", undefined, "Recent decisions")}
          </h3>
          <div className="surface divide-y divide-[var(--p-border)]">
            {decided.map((r) => {
              const holder = holders.get(r.holder_id);
              const cert = holder ? certs.get(holder.certification_id) : undefined;
              const member = memberById.get(r.user_id);
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant={RECERT_TONES[r.recert_state]}>{RECERT_STATE_LABELS[r.recert_state]}</Badge>
                    <span className="text-[var(--p-text-1)]">{member?.name ?? r.user_id.slice(0, 8)}</span>
                    <span className="text-[var(--p-text-2)]">{cert?.name ?? "—"}</span>
                  </span>
                  <span className="text-xs text-[var(--p-text-3)]">
                    {r.decided_at ? r.decided_at.slice(0, 10) : ""}
                    {r.decision_note ? ` · ${r.decision_note}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
