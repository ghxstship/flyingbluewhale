export const dynamic = "force-dynamic";

import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CORRECTION_KIND_LABEL, type CorrectionKind } from "@/lib/time/corrections";
import { CorrectionDecision } from "./CorrectionDecision";

/**
 * `/studio/finance/timesheets/corrections` — the manager's queue.
 *
 * The other half of the loop Phase 2 opened. A worker could file a
 * correction from `/m/clock` and the API could decide it, but no console
 * surface existed, so in practice a request went nowhere: separation of
 * duties is meaningless if the person with the duty can't see the request.
 *
 * Shows what the worker is disputing (original vs proposed), in their
 * words, because a decision made without the reason is a rubber stamp.
 */

type Row = {
  id: string;
  time_entry_id: string | null;
  timesheet_id: string | null;
  requester_id: string;
  correction_kind: CorrectionKind;
  correction_state: string;
  reason: string;
  original_started_at: string | null;
  original_ended_at: string | null;
  proposed_started_at: string | null;
  proposed_ended_at: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
};

export default async function Page() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  if (!isManagerPlus(session)) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.corrections.eyebrow", undefined, "Finance")}
          title={t("console.finance.corrections.title", undefined, "Time Corrections")}
        />
        <div className="page-content">
          <EmptyState
            title={t("console.finance.corrections.noAccess.title", undefined, "Managers only")}
            description={t(
              "console.finance.corrections.noAccess.body",
              undefined,
              "Deciding a colleague's time correction is a supervisory job. Your own requests live on your clock screen.",
            )}
          />
        </div>
      </>
    );
  }

  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("time_entry_corrections")
    .select(
      "id, time_entry_id, timesheet_id, requester_id, correction_kind, correction_state, reason, original_started_at, original_ended_at, proposed_started_at, proposed_ended_at, decided_at, decision_notes, created_at",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Row[];

  const open = rows.filter((r) => r.correction_state === "requested");
  const settled = rows.filter((r) => r.correction_state !== "requested").slice(0, 20);

  // Requester names — no FK embed between corrections and users.
  const ids = [...new Set(rows.map((r) => r.requester_id))];
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { data: users } = await db.from("users").select("id, name, email").in("id", ids);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameById.set(u.id, u.name ?? u.email ?? "");
    }
  }

  const when = (iso: string | null) => (iso ? `${fmt.date(iso)} ${fmt.time(iso)}` : "—");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.corrections.eyebrow", undefined, "Finance")}
        title={t("console.finance.corrections.title", undefined, "Time Corrections")}
        subtitle={t(
          "console.finance.corrections.subtitle",
          { open: open.length },
          `${open.length} waiting on a decision`,
        )}
      />
      <div className="page-content space-y-5">
        {open.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.finance.corrections.empty.title", undefined, "Nothing waiting")}
            description={t(
              "console.finance.corrections.empty.body",
              undefined,
              "When someone's punch is wrong they can request a fix from their clock screen. It lands here for you to approve.",
            )}
          />
        ) : (
          <section className="space-y-3">
            {open.map((r) => (
              <div key={r.id} className="surface space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--p-text-1)]">
                      {nameById.get(r.requester_id) ?? "—"}
                      <span className="ml-2 font-normal text-[var(--p-text-2)]">
                        {CORRECTION_KIND_LABEL[r.correction_kind]}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--p-text-3)]">
                      {t("console.finance.corrections.filed", undefined, "Filed")} {when(r.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={r.correction_state} />
                </div>

                {/* The worker's own words. A decision without them is a rubber stamp. */}
                <p className="text-sm text-[var(--p-text-1)]">{r.reason}</p>

                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[var(--p-text-3)]">
                      {t("console.finance.corrections.recorded", undefined, "Recorded")}
                    </dt>
                    <dd className="font-mono text-[var(--p-text-2)]">
                      {when(r.original_started_at)} – {when(r.original_ended_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--p-text-3)]">
                      {t("console.finance.corrections.proposed", undefined, "They say it should be")}
                    </dt>
                    <dd className="font-mono text-[var(--p-text-1)]">
                      {when(r.proposed_started_at)} – {when(r.proposed_ended_at)}
                    </dd>
                  </div>
                </dl>

                <CorrectionDecision correctionId={r.id} selfRequested={r.requester_id === session.userId} />
              </div>
            ))}
          </section>
        )}

        {settled.length > 0 && (
          <section className="surface space-y-3 p-5">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
              {t("console.finance.corrections.settled", undefined, "Recently settled")}
            </h2>
            <ul className="space-y-2">
              {settled.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 border-t border-[var(--p-border)] pt-2">
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--p-text-1)]">
                      {nameById.get(r.requester_id) ?? "—"} · {CORRECTION_KIND_LABEL[r.correction_kind]}
                    </div>
                    <div className="text-xs text-[var(--p-text-3)]">
                      {when(r.decided_at)}
                      {r.decision_notes ? ` · ${r.decision_notes}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={r.correction_state} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
