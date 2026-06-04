import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { MileageLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function MileagePage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.mileage.title", undefined, "Mileage")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.mileage.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("mileage_logs", session.orgId, { orderBy: "logged_on" });
  const totalMiles = rows.reduce((s, r) => s + Number(r.miles), 0);
  const totalCents = rows.reduce((s, r) => s + Math.round(Number(r.miles) * Number(r.rate_cents)), 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.mileage.title", undefined, "Mileage")}
        subtitle={t(
          "console.finance.mileage.subtitle",
          { miles: totalMiles.toFixed(1), amount: formatMoney(totalCents) },
          `${totalMiles.toFixed(1)} miles · ${formatMoney(totalCents)}`,
        )}
        action={
          <Button href="/console/finance/mileage/new">
            {t("console.finance.mileage.logMileage", undefined, "+ Log mileage")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<MileageLog>
          rows={rows}
          rowHref={(r) => `/console/finance/mileage/${r.id}`}
          emptyLabel={t("console.finance.mileage.emptyLabel", undefined, "No mileage logged")}
          emptyDescription={t(
            "console.finance.mileage.emptyDescription",
            undefined,
            "Personal-vehicle miles for reimbursement at the configured per-mile rate.",
          )}
          emptyAction={
            <Button href="/console/finance/mileage/new" size="sm">
              {t("console.finance.mileage.logMileage", undefined, "+ Log mileage")}
            </Button>
          }
          columns={[
            {
              key: "origin",
              header: t("console.finance.mileage.columns.origin", undefined, "Origin"),
              render: (r) => r.origin,
              accessor: (r) => r.origin,
            },
            {
              key: "destination",
              header: t("console.finance.mileage.columns.destination", undefined, "Destination"),
              render: (r) => r.destination,
              accessor: (r) => r.destination,
            },
            {
              key: "miles",
              header: t("console.finance.mileage.columns.miles", undefined, "Miles"),
              render: (r) => Number(r.miles).toFixed(1),
              className: "font-mono text-xs",
              accessor: (r) => r.miles ?? null,
            },
            {
              key: "reimbursement",
              header: t("console.finance.mileage.columns.reimbursement", undefined, "Reimbursement"),
              render: (r) => formatMoney(Math.round(Number(r.miles) * Number(r.rate_cents))),
              className: "font-mono text-xs",
              accessor: (r) => Math.round(Number(r.miles ?? 0) * Number(r.rate_cents ?? 0)),
            },
            {
              key: "date",
              header: t("console.finance.mileage.columns.date", undefined, "Date"),
              render: (r) => r.logged_on,
              className: "font-mono text-xs",
              accessor: (r) => r.logged_on,
            },
          ]}
        />
      </div>
    </>
  );
}
