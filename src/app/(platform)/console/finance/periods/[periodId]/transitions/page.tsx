import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getAccountingPeriod, listAccountingPeriodTransitions } from "@/lib/accounting-periods";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodTransitionsPage({ params }: { params: Promise<{ periodId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { periodId } = await params;
  const period = await getAccountingPeriod(session.orgId, periodId);
  if (!period) notFound();
  const transitions = await listAccountingPeriodTransitions(session.orgId, periodId);

  return (
    <>
      <ModuleHeader
        eyebrow={
          (
            <Link href={`/console/finance/periods/${period.id}`} className="hover:underline">
              ← {period.period_label}
            </Link>
          ) as unknown as string
        }
        title="State Transitions"
        subtitle={`${transitions.length} append-only entries`}
      />
      <div className="page-content">
        <div className="surface overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{new Date(t.transitioned_at).toLocaleString()}</td>
                  <td className="font-mono text-xs">{t.from_state ?? "(initial)"}</td>
                  <td className="font-mono text-xs font-bold">{t.to_state}</td>
                  <td>{t.reason ?? "—"}</td>
                  <td className="font-mono text-xs">{t.transitioned_by ?? "—"}</td>
                </tr>
              ))}
              {transitions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--text-secondary)]">
                    No transitions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
