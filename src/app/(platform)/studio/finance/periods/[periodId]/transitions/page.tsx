import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { getAccountingPeriod, listAccountingPeriodTransitions } from "@/lib/accounting-periods";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodTransitionsPage({ params }: { params: Promise<{ periodId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { periodId } = await params;
  const period = await getAccountingPeriod(session.orgId, periodId);
  if (!period) notFound();
  const transitions = await listAccountingPeriodTransitions(session.orgId, periodId);
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  return (
    <>
      <ModuleHeader
        eyebrow={
          (
            <Link href={`/studio/finance/periods/${period.id}`} className="hover:underline">
              ← {period.period_label}
            </Link>
          ) as unknown as string
        }
        title={t("console.finance.periods.transitions.title", undefined, "State Transitions")}
        subtitle={t(
          "console.finance.periods.transitions.subtitle",
          { count: transitions.length },
          `${transitions.length} append-only entries`,
        )}
      />
      <div className="page-content">
        <div className="surface overflow-hidden">
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("console.finance.periods.transitions.col.when", undefined, "When")}</th>
                <th>{t("console.finance.periods.transitions.col.from", undefined, "From")}</th>
                <th>{t("console.finance.periods.transitions.col.to", undefined, "To")}</th>
                <th>{t("console.finance.periods.transitions.col.reason", undefined, "Reason")}</th>
                <th>{t("console.finance.periods.transitions.col.by", undefined, "By")}</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-xs">{fmt.dateTime(new Date(row.transitioned_at))}</td>
                  <td className="font-mono text-xs">
                    {row.from_state ?? t("console.finance.periods.transitions.initial", undefined, "(initial)")}
                  </td>
                  <td className="font-mono text-xs font-bold">{row.to_state}</td>
                  <td>{row.reason ?? "—"}</td>
                  <td className="font-mono text-xs">{row.transitioned_by ?? "—"}</td>
                </tr>
              ))}
              {transitions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center">
                    <EmptyState
                      size="compact"
                      title={t("console.finance.periods.transitions.empty", undefined, "No transitions yet")}
                    />
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
