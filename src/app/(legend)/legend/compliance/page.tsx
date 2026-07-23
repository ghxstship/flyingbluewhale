import { ModuleHeader } from "@/components/Shell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import {
  ACCREDITATION_STATES,
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  effectiveAccreditationState,
  type AccreditationState,
  type Certification,
  type CertificationHolder,
} from "@/lib/legend_compliance";
import type { StateTone } from "@/lib/tones";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/** Map a state tone → the matrix cell paint (token-only). */
const CELL_BG: Record<StateTone, string> = {
  success: "color-mix(in srgb, var(--p-success) 20%, var(--p-surface))",
  warning: "color-mix(in srgb, var(--p-warning) 22%, var(--p-surface))",
  error: "color-mix(in srgb, var(--p-danger) 20%, var(--p-surface))",
  info: "color-mix(in srgb, var(--p-info) 18%, var(--p-surface))",
  muted: "var(--p-surface-2, var(--p-surface))",
  default: "var(--p-surface)",
};
const CELL_FG: Record<StateTone, string> = {
  success: "var(--p-success)",
  warning: "var(--p-warning)",
  error: "var(--p-danger)",
  info: "var(--p-info)",
  muted: "var(--p-text-2)",
  default: "var(--p-text-2)",
};

/**
 * /legend/compliance — the recert compliance matrix. A bespoke people ×
 * certifications grid (NOT a generic DataView): each cell is painted from
 * the holder's effective `accreditation_state` tone, so a manager reads org
 * credential health at a glance. Manager+ only (self-gated).
 */
export default async function ComplianceMatrixPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.compliance.eyebrow", undefined, "LEG3ND · Compliance")}
          title={t("console.legend.compliance.title", undefined, "Recert Matrix")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();

  const [members, { data: certData }, { data: holderData }] = await Promise.all([
    listOrgMembers(session.orgId),
    db
      .from("legend_certifications")
      .select("id, org_id, code, name, description, validity_months, recert_window_days, certification_state")
      .eq("org_id", session.orgId)
      .eq("certification_state", "active")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    db
      .from("certification_holders")
      .select("id, org_id, certification_id, user_id, source_course_id, issued_at, expires_on, last_recert_at, next_recert_due, accreditation_state")
      .eq("org_id", session.orgId),
  ]);

  const certs = (certData ?? []) as Certification[];
  const certWindow = new Map(certs.map((c) => [c.id, c.recert_window_days]));
  // (user_id, cert_id) -> holder
  const holderMap = new Map<string, CertificationHolder>();
  for (const h of (holderData ?? []) as CertificationHolder[]) {
    holderMap.set(`${h.user_id}::${h.certification_id}`, h);
  }

  // counts per state for the legend / health summary
  const counts: Record<AccreditationState, number> = {
    pending: 0,
    valid: 0,
    expiring: 0,
    expired: 0,
    suspended: 0,
    revoked: 0,
  };
  for (const h of (holderData ?? []) as CertificationHolder[]) {
    const eff = effectiveAccreditationState(h, certWindow.get(h.certification_id) ?? 30, now);
    counts[eff] += 1;
  }

  if (certs.length === 0 || members.length === 0) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.compliance.eyebrow", undefined, "LEG3ND · Compliance")}
          title={t("console.legend.compliance.title", undefined, "Recert Matrix")}
        />
        <EmptyState
          title={t("console.legend.compliance.emptyTitle", undefined, "Nothing to chart yet")}
          description={t(
            "console.legend.compliance.emptyDescription",
            undefined,
            "Add certifications and org members to populate the recert matrix.",
          )}
        />
      </>
    );
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.compliance.eyebrow", undefined, "LEG3ND · Compliance")}
        title={t("console.legend.compliance.title", undefined, "Recert Matrix")}
        subtitle={t(
          "console.legend.compliance.subtitle",
          undefined,
          "Org credential health: every member × certification, colored by state.",
        )}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {ACCREDITATION_STATES.map((s) => {
          const tone = ACCREDITATION_STATE_TONES[s];
          return (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs" style={{ background: CELL_BG[tone], color: CELL_FG[tone] }}>
              <span className="h-2 w-2 rounded-full" style={{ background: CELL_FG[tone] }} aria-hidden="true" />
              {ACCREDITATION_STATE_LABELS[s]} · {counts[s]}
            </span>
          );
        })}
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[var(--p-surface)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--p-text-3)]">
                {t("console.legend.compliance.member", undefined, "Member")}
              </th>
              {certs.map((c) => (
                <th key={c.id} className="px-2 py-2 text-center text-xs font-semibold text-[var(--p-text-2)]" title={c.name}>
                  <span className="block max-w-[7rem] truncate">{c.code || c.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-[var(--p-border)]">
                <td className="sticky left-0 z-10 bg-[var(--p-surface)] px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar size="xs" name={m.name} src={m.avatar_url ?? undefined} />
                    <span className="truncate text-[var(--p-text-1)]">{m.name}</span>
                  </span>
                </td>
                {certs.map((c) => {
                  const h = holderMap.get(`${m.id}::${c.id}`);
                  if (!h) {
                    return (
                      <td key={c.id} className="px-2 py-2 text-center text-xs text-[var(--p-text-3)]">
                        —
                      </td>
                    );
                  }
                  const eff = effectiveAccreditationState(h, c.recert_window_days, now);
                  const tone = ACCREDITATION_STATE_TONES[eff];
                  return (
                    <td
                      key={c.id}
                      className="px-2 py-2 text-center"
                      style={{ background: CELL_BG[tone] }}
                      title={
                        h.expires_on
                          ? t(
                              "console.legend.compliance.cellExpires",
                              { state: ACCREDITATION_STATE_LABELS[eff], date: h.expires_on },
                              `${ACCREDITATION_STATE_LABELS[eff]} · expires ${h.expires_on}`,
                            )
                          : ACCREDITATION_STATE_LABELS[eff]
                      }
                    >
                      <span className="text-xs font-medium" style={{ color: CELL_FG[tone] }}>
                        {ACCREDITATION_STATE_LABELS[eff]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
