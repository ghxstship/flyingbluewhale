import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.catalog.eyebrow", undefined, "Settings")}
          title={t("console.settings.catalog.title", undefined, "Master Catalog")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.catalog.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, unit_cost_cents, currency, inventory_qty, active, created_at")
    .limit(1000)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("kind")
    .order("name");
  const rows = (data ?? []) as Row[];

  const KIND_LABEL_I18N: Record<string, string> = {
    credential: t("console.settings.catalog.kind.credential", undefined, "Credentials"),
    catering: t("console.settings.catalog.kind.catering", undefined, "Catering"),
    radio: t("console.settings.catalog.kind.radio", undefined, "Radios"),
    tool: t("console.settings.catalog.kind.tool", undefined, "Tools"),
    equipment: t("console.settings.catalog.kind.equipment", undefined, "Equipment"),
    uniform: t("console.settings.catalog.kind.uniform", undefined, "Uniforms"),
    travel: t("console.settings.catalog.kind.travel", undefined, "Travel"),
    lodging: t("console.settings.catalog.kind.lodging", undefined, "Lodging"),
    vehicle: t("console.settings.catalog.kind.vehicle", undefined, "Vehicles"),
  };
  const itemWord =
    rows.length === 1
      ? t("console.settings.catalog.itemSingular", undefined, "Item")
      : t("console.settings.catalog.itemPlural", undefined, "Items");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.catalog.eyebrow", undefined, "Settings")}
        title={t("console.settings.catalog.title", undefined, "Master Catalog")}
        subtitle={t(
          "console.settings.catalog.subtitle",
          { count: rows.length, itemWord },
          `${rows.length} ${itemWord} · the assignable inventory for advancing surfaces`,
        )}
        action={
          <Button href="/console/settings/catalog/new" size="sm">
            {t("console.settings.catalog.newItem", undefined, "+ New Item")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/catalog/${r.id}`}
          emptyLabel={t("console.settings.catalog.emptyLabel", undefined, "No catalog items yet")}
          emptyDescription={t(
            "console.settings.catalog.emptyDescription",
            undefined,
            "Define reusable credentials, uniforms, radios, vehicles, etc. so admins can pick from a dropdown when assigning to people.",
          )}
          columns={[
            {
              key: "kind",
              header: t("console.settings.catalog.columns.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{KIND_LABEL_I18N[r.kind] ?? KIND_LABEL[r.kind] ?? r.kind}</Badge>,
            },
            {
              key: "code",
              header: t("console.settings.catalog.columns.code", undefined, "Code"),
              render: (r) => r.code,
              mono: true,
            },
            {
              key: "name",
              header: t("console.settings.catalog.columns.name", undefined, "Name"),
              render: (r) => r.name,
            },
            {
              key: "inventory_qty",
              header: t("console.settings.catalog.columns.inv", undefined, "Inv"),
              render: (r) => r.inventory_qty ?? "—",
              mono: true,
            },
            {
              key: "unit_cost_cents",
              header: t("console.settings.catalog.columns.unit", undefined, "Unit"),
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
              header: t("console.settings.catalog.columns.status", undefined, "Status"),
              render: (r) =>
                r.active ? (
                  <Badge variant="success">{t("console.settings.catalog.statusActive", undefined, "Active")}</Badge>
                ) : (
                  <Badge variant="muted">{t("console.settings.catalog.statusInactive", undefined, "Inactive")}</Badge>
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
