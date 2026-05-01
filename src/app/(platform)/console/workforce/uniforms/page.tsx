import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type UniformRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit_price_cents: number;
  currency: string;
  active: boolean;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Uniforms" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("rate_card_items", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
    filters: [{ column: "catalog", op: "eq", value: "uniform" }],
  })) as UniformRow[];

  const totalSkus = rows.length;
  const activeSkus = rows.filter((r) => r.active).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Uniforms"
        subtitle={`${totalSkus} SKU${totalSkus === 1 ? "" : "s"} · ${activeSkus} active`}
        action={
          <Button href="/console/logistics/ratecard/new" size="sm">
            + New SKU
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<UniformRow>
          rows={rows}
          rowHref={(r) => `/console/logistics/ratecard/${r.id}`}
          emptyLabel="No uniform SKUs"
          emptyDescription="Uniform inventory is tracked in the rate card with catalog='uniform'. Author each style + size as a SKU with a unit cost."
          emptyAction={
            <Button href="/console/logistics/ratecard/new" size="sm">
              + New SKU
            </Button>
          }
          columns={[
            { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "description",
              header: "Description",
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "unit_price_cents",
              header: "Unit Cost",
              render: (r) => formatMoney(r.unit_price_cents, r.currency),
              className: "font-mono text-xs",
            },
            {
              key: "active",
              header: "Active",
              render: (r) =>
                r.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Retired</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
