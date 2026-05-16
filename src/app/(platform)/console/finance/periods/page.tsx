import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listAccountingPeriods, type AccountingPeriod } from "@/lib/accounting-periods";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function FinancePeriodsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Accounting Periods" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Finance"
        title="Accounting Periods"
        subtitle={`${rows.length} total · ${open} open · ${closed} closed/audited`}
        action={<Button href="/console/finance/periods/new">+ New Period</Button>}
      />
      <div className="page-content">
        <DataTable<AccountingPeriod>
          rows={rows}
          rowHref={(r) => `/console/finance/periods/${r.id}`}
          columns={[
            { key: "label", header: "Label", render: (r) => r.period_label, accessor: (r) => r.period_label },
            {
              key: "range",
              header: "Range",
              render: (r) => `${r.starts_on} → ${r.ends_on}`,
              className: "font-mono text-xs",
              accessor: (r) => r.starts_on,
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={badgeVariantForState(r.state)}>{r.state}</Badge>,
              accessor: (r) => r.state,
            },
            {
              key: "closed",
              header: "Closed",
              render: (r) => (r.closed_at ? formatDate(r.closed_at, "short") : "—"),
              className: "text-xs text-[var(--text-secondary)]",
              accessor: (r) => r.closed_at,
            },
          ]}
          emptyLabel="No accounting periods yet"
          emptyDescription="Open a monthly, quarterly, or fiscal period to track revenue + expense recognition. Closing freezes the period."
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
