import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listAccountingPeriods, type AccountingPeriod } from "@/lib/accounting-periods";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function FinancePeriodsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.finance.periods.title", undefined, "Accounting Periods")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.periods.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listAccountingPeriods(session.orgId);
  const open = rows.filter((r) => r.state === "OPEN" || r.state === "IN_PERIOD").length;
  const closed = rows.filter((r) => r.state === "CLOSED" || r.state === "AUDITED").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.periods.title", undefined, "Accounting Periods")}
        subtitle={t(
          "console.finance.periods.subtitle",
          { total: rows.length, open, closed },
          `${rows.length} Total · ${open} Open  · ${closed} closed/audited`,
        )}
        action={
          <Button href="/studio/finance/periods/new">
            {t("console.finance.periods.newCta", undefined, "+ New Period")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<AccountingPeriod>
          rows={rows}
          rowHref={(r) => `/studio/finance/periods/${r.id}`}
          columns={[
            {
              key: "label",
              header: t("console.finance.periods.cols.label", undefined, "Label"),
              render: (r) => r.period_label,
              accessor: (r) => r.period_label,
            },
            {
              key: "range",
              header: t("console.finance.periods.cols.range", undefined, "Range"),
              render: (r) => `${r.starts_on} → ${r.ends_on}`,
              className: "font-mono text-xs",
              accessor: (r) => r.starts_on,
            },
            {
              key: "state",
              header: t("console.finance.periods.cols.state", undefined, "State"),
              render: (r) => <Badge variant={badgeVariantForState(r.state)}>{toTitle(r.state)}</Badge>,
              accessor: (r) => r.state,
            },
            {
              key: "closed",
              header: t("console.finance.periods.cols.closed", undefined, "Closed"),
              render: (r) => (r.closed_at ? new Date(r.closed_at).toLocaleDateString() : "—"),
              className: "text-xs text-[var(--p-text-2)]",
              accessor: (r) => r.closed_at,
            },
          ]}
          emptyLabel={t("console.finance.periods.empty.label", undefined, "No accounting periods yet")}
          emptyDescription={t(
            "console.finance.periods.empty.description",
            undefined,
            "Open a monthly, quarterly, or fiscal period to track revenue + expense recognition. Closing freezes the period.",
          )}
        />
      </div>
    </>
  );
}

function badgeVariantForState(state: AccountingPeriod["state"]): "default" | "success" | "warning" | "muted" {
  switch (state) {
    case "OPEN":
    case "IN_PERIOD":
      return "success";
    case "CLOSING":
      return "warning";
    case "CLOSED":
      return "default";
    case "AUDITED":
      return "default";
    case "ARCHIVED":
      return "muted";
    default:
      return "default";
  }
}
