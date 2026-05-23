import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import type { Rental } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Rentals" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("rentals", session.orgId, { orderBy: "starts_at" });
  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Rentals"
        subtitle={`${rows.length} Active  rentals`}
        action={<Button href="/console/production/rentals/new">+ New Rental</Button>}
      />
      <div className="page-content">
        <DataTable<Rental>
          rows={rows}
          rowHref={(r) => `/console/production/rentals/${r.id}`}
          emptyLabel="No active rentals"
          emptyDescription="A rental records when an asset is reserved or out of the warehouse for a date range."
          emptyAction={
            <Button href="/console/production/rentals/new" size="sm">
              + New Rental
            </Button>
          }
          columns={[
            {
              key: "equipment_id",
              header: "Equipment",
              render: (r) => <span className="font-mono text-xs">{r.equipment_id.slice(0, 8)}</span>,
              accessor: (r) => r.equipment_id.slice ?? null,
            },
            {
              key: "starts",
              header: "Starts",
              render: (r) => formatDate(r.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: "Ends",
              render: (r) => formatDate(r.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at,
            },
            {
              key: "rate",
              header: "Rate",
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
