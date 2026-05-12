import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  code: string;
  name: string;
  unit_cost_cents: number | null;
  currency: string | null;
  inventory_qty: number | null;
  active: boolean;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  credential: "Credentials",
  catering: "Catering",
  radio: "Radios",
  tool: "Tools",
  equipment: "Equipment",
  uniform: "Uniforms",
  travel: "Travel",
  lodging: "Lodging",
  vehicle: "Vehicles",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Master Catalog" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, unit_cost_cents, currency, inventory_qty, active, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("kind")
    .order("name");
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Master Catalog"
        subtitle={`${rows.length} item${rows.length === 1 ? "" : "s"} · the assignable inventory for advancing surfaces`}
        action={
          <Button href="/console/settings/catalog/new" size="sm">
            + New Item
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/catalog/${r.id}`}
          emptyLabel="No catalog items yet"
          emptyDescription="Define reusable credentials, uniforms, radios, vehicles, etc. so admins can pick from a dropdown when assigning to people."
          columns={[
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant="muted">{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
            },
            { key: "code", header: "Code", render: (r) => r.code, mono: true },
            { key: "name", header: "Name", render: (r) => r.name },
            {
              key: "inventory_qty",
              header: "Inv",
              render: (r) => r.inventory_qty ?? "—",
              mono: true,
            },
            {
              key: "unit_cost_cents",
              header: "Unit",
              render: (r) =>
                r.unit_cost_cents != null
                  ? (r.unit_cost_cents / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: r.currency ?? "USD",
                    })
                  : "—",
              mono: true,
            },
            {
              key: "active",
              header: "Status",
              render: (r) =>
                r.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
