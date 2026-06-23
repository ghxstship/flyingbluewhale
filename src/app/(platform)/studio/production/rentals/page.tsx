import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Rental } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.production.rentals.title", undefined, "Rentals")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.rentals.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("rentals", session.orgId, { orderBy: "starts_at" });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.eyebrow", undefined, "Production")}
        title={t("console.production.rentals.title", undefined, "Rentals")}
        subtitle={t("console.production.rentals.subtitle", { count: rows.length }, `${rows.length} Active  rentals`)}
        action={
          <Button href="/studio/production/rentals/new">
            {t("console.production.rentals.newRental", undefined, "+ New Rental")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Rental>
          rows={rows}
          rowHref={(r) => `/studio/production/rentals/${r.id}`}
          emptyLabel={t("console.production.rentals.emptyLabel", undefined, "No active rentals")}
          emptyDescription={t(
            "console.production.rentals.emptyDescription",
            undefined,
            "A rental records when an asset is reserved or out of the warehouse for a date range.",
          )}
          emptyAction={
            <Button href="/studio/production/rentals/new" size="sm">
              {t("console.production.rentals.newRental", undefined, "+ New Rental")}
            </Button>
          }
          columns={[
            {
              key: "equipment_id",
              header: t("console.production.rentals.columns.equipment", undefined, "Equipment"),
              render: (r) => <span className="font-mono text-xs">{r.equipment_id.slice(0, 8)}</span>,
              accessor: (r) => r.equipment_id.slice ?? null,
            },
            {
              key: "starts",
              header: t("console.production.rentals.columns.starts", undefined, "Starts"),
              render: (r) => formatDate(r.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: t("console.production.rentals.columns.ends", undefined, "Ends"),
              render: (r) => formatDate(r.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at,
            },
            {
              key: "rate",
              header: t("console.production.rentals.columns.rate", undefined, "Rate"),
              render: (r) => formatMoney(r.rate_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.rate_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
