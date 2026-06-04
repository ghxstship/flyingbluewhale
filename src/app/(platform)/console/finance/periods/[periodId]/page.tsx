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
import { AccountingPeriodStateControls } from "./AccountingPeriodStateControls";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodDetailPage({ params }: { params: Promise<{ periodId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { periodId } = await params;
  const period = await getAccountingPeriod(session.orgId, periodId);
  if (!period) notFound();
  const transitions = await listAccountingPeriodTransitions(session.orgId, periodId);
  const allowedNext = ACCOUNTING_PERIOD_TRANSITION_GRAPH[period.state];

  return (
    <>
      <ModuleHeader
        eyebrow="Accounting Period"
        title={period.period_label}
        subtitle={`${period.starts_on} → ${period.ends_on}`}
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-4 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">State</h2>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base">
              {period.state}
            </Badge>
            <span className="text-sm text-[var(--text-secondary)]">
              Allowed next: {allowedNext.length === 0 ? "—" : allowedNext.join(", ")}
            </span>
          </div>
          <AccountingPeriodStateControls periodId={period.id} currentState={period.state} allowedNext={allowedNext} />
          {period.state === "CLOSED" || period.state === "AUDITED" ? (
            <p className="text-xs text-[var(--text-secondary)]">
              <strong>Period frozen.</strong> No new journal entries can post to this period. Corrections must use
              reversing entries in the open period that reference the closed entry.
            </p>
          ) : null}
        </section>

        <section className="surface space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Recent Transitions ({transitions.length})</h2>
            <Link href={`/console/finance/periods/${period.id}/transitions`} className="text-xs underline">
              Full log →
            </Link>
          </div>
          {transitions.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No transitions logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transitions.slice(0, 8).map((t) => (
                <li key={t.id} className="border-b border-[var(--border-color)] pb-2 last:border-0">
                  <span className="font-mono text-xs">
                    {t.from_state ?? "(initial)"} → <strong>{t.to_state}</strong>
                  </span>{" "}
                  · <span className="text-[var(--text-secondary)]">{timeAgo(t.transitioned_at)}</span>
                  {t.reason ? <span className="ms-2">{t.reason}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
