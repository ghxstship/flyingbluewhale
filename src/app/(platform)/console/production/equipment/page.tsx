import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Equipment, EquipmentStatus } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

const STATUS_BG: Record<EquipmentStatus, "success" | "warning" | "info" | "muted" | "error"> = {
  available: "success",
  reserved: "info",
  in_use: "info",
  maintenance: "warning",
  retired: "muted",
};

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Equipment" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const allRows = await listOrgScoped("equipment", session.orgId, { orderBy: "name", ascending: true });
  // Hide soft-deleted rows from the list. Retired equipment stays visible
  // (it's part of the org history); only true deletes get hidden.
  const rows = allRows.filter((r) => r.deleted_at == null);
  const available = rows.filter((r) => r.status === "available").length;
  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Equipment"
        subtitle={`${rows.length} ${rows.length === 1 ? "Item" : "Items"} · ${available} Available`}
        action={
          <Button href="/console/production/equipment/new" size="sm">
            + Add Equipment
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Equipment>
          rows={rows}
          rowHref={(r) => `/console/production/equipment/${r.id}`}
          emptyLabel="No equipment yet"
          emptyDescription="Track every owned + rented asset with rates, asset tags, and lifecycle status."
          emptyAction={
            <Button href="/console/production/equipment/new" size="sm">
              + Add equipment
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "category",
              header: "Category",
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "tag",
              header: "Asset Tag",
              render: (r) => r.asset_tag ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_BG[r.status]}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
            {
              key: "rate",
              header: "Daily Rate",
              render: (r) => formatMoney(r.daily_rate_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.daily_rate_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
