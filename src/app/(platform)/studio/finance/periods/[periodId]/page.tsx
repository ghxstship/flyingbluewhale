import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import {
  getAccountingPeriod,
  listAccountingPeriodTransitions,
  ACCOUNTING_PERIOD_TRANSITION_GRAPH,
} from "@/lib/accounting-periods";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { AccountingPeriodStateControls } from "./AccountingPeriodStateControls";
import { CloseChecklist, type CloseItem } from "./CloseChecklist";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodDetailPage({ params }: { params: Promise<{ periodId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const { periodId } = await params;
  const period = await getAccountingPeriod(session.orgId, periodId);
  if (!period) notFound();
  const transitions = await listAccountingPeriodTransitions(session.orgId, periodId);
  const allowedNext = ACCOUNTING_PERIOD_TRANSITION_GRAPH[period.state];

  // Close checklist (kit 21 R3) — close-kind tasks scoped to this period.
  const supabase = await createClient();
  const { data: closeTasks } = await supabase
    .from("tasks")
    .select("id, title, task_state")
    .eq("org_id", session.orgId)
    .eq("period_id", periodId)
    .eq("kind", "close")
    .order("created_at", { ascending: true });
  const closeItems: CloseItem[] = ((closeTasks ?? []) as Array<{ id: string; title: string; task_state: string }>).map(
    (r) => ({ id: r.id, title: r.title, done: r.task_state === "done" }),
  );
  const periodLocked = period.state === "CLOSED" || period.state === "AUDITED";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.periods.detail.eyebrow", undefined, "Accounting Period")}
        title={period.period_label}
        subtitle={`${period.starts_on} → ${period.ends_on}`}
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-4 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.finance.periods.detail.stateHeading", undefined, "Status")}
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base">
              {period.state}
            </Badge>
            <span className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.finance.periods.detail.allowedNext",
                { next: allowedNext.length === 0 ? "—" : allowedNext.join(", ") },
                `Allowed next: ${allowedNext.length === 0 ? "—" : allowedNext.join(", ")}`,
              )}
            </span>
          </div>
          <AccountingPeriodStateControls periodId={period.id} currentState={period.state} allowedNext={allowedNext} />
          {period.state === "CLOSED" || period.state === "AUDITED" ? (
            <p className="text-xs text-[var(--p-text-2)]">
              <strong>{t("console.finance.periods.detail.frozenLabel", undefined, "Period frozen.")}</strong>{" "}
              {t(
                "console.finance.periods.detail.frozenBody",
                undefined,
                "No new journal entries can post to this period. Corrections must use reversing entries in the open period that reference the closed entry.",
              )}
            </p>
          ) : null}
        </section>

        <CloseChecklist periodId={period.id} items={closeItems} locked={periodLocked} />

        <section className="surface space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t(
                "console.finance.periods.detail.recentTransitions",
                { count: transitions.length },
                `Recent Transitions (${transitions.length})`,
              )}
            </h2>
            <Link href={`/studio/finance/periods/${period.id}/transitions`} className="text-xs underline">
              {t("console.finance.periods.detail.fullLogLink", undefined, "Full log →")}
            </Link>
          </div>
          {transitions.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("console.finance.periods.detail.noTransitions", undefined, "No transitions logged yet.")}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transitions.slice(0, 8).map((row) => (
                <li key={row.id} className="border-b border-[var(--p-border)] pb-2 last:border-0">
                  <span className="font-mono text-xs">
                    {row.from_state ?? t("console.finance.periods.detail.initialState", undefined, "(initial)")} →{" "}
                    <strong>{row.to_state}</strong>
                  </span>{" "}
                  · <span className="text-[var(--p-text-2)]">{timeAgo(row.transitioned_at)}</span>
                  {row.reason ? <span className="ms-2">{row.reason}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
