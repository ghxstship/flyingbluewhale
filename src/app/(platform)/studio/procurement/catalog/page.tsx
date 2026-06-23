export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toTitle } from "@/lib/format";
import { DataTable } from "@/components/DataTable";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

type CatalogRow = {
  id: string;
  name: string;
  category: string | null;
  asset_tag: string | null;
  daily_rate_cents: number | null;
  equipment_state: string;
};

/**
 * Approved-item catalog = every owned equipment row that's not retired.
 * The `equipment` table doubles as the SKU library — each tag, rate,
 * and category is the same shape a dedicated `catalog_items` table
 * would carry.
 */
export default async function CatalogPage() {
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("id, name, category, asset_tag, daily_rate_cents, equipment_state")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("equipment_state", "retired")
    .order("category", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  const rows = (data ?? []) as CatalogRow[];
  const uncategorized = t("console.procurement.catalog.uncategorized", undefined, "Uncategorized");
  const categoryCount = new Set(rows.map((r) => r.category ?? uncategorized)).size;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.catalog.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.catalog.title", undefined, "Approved Item Catalog")}
        subtitle={t(
          "console.procurement.catalog.subtitle",
          {
            itemCount: rows.length,
            itemLabel: rows.length === 1 ? "Item" : "Items",
            categoryCount,
            categoryLabel: categoryCount === 1 ? "category" : "categories",
          },
          `${rows.length} Item${rows.length === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`,
        )}
      />
      <div className="page-content max-w-5xl">
        <DataTable<CatalogRow>
          rows={rows}
          tableId="console:procurement:catalog"
          rowHref={(i) => `/studio/production/equipment/${i.id}`}
          emptyLabel={t("console.procurement.catalog.empty.title", undefined, "No Items in the Catalog Yet")}
          emptyDescription={t(
            "console.procurement.catalog.empty.description",
            undefined,
            "Add equipment via the Production module or bulk-import through Settings → Imports. Every non-retired item appears here as a SKU.",
          )}
          emptyAction={
            <Link className="text-sm text-[var(--p-accent)]" href="/studio/production/equipment">
              {t("console.procurement.catalog.empty.cta", undefined, "Go to Equipment →")}
            </Link>
          }
          columns={[
            {
              key: "category",
              header: t("console.procurement.catalog.column.category", undefined, "Category"),
              render: (i) => i.category ?? uncategorized,
              accessor: (i) => i.category ?? uncategorized,
              filterable: true,
              groupable: true,
            },
            {
              key: "name",
              header: t("console.procurement.catalog.column.name", undefined, "Name"),
              render: (i) => i.name,
              accessor: (i) => i.name,
            },
            {
              key: "asset_tag",
              header: t("console.procurement.catalog.column.assetTag", undefined, "Asset tag"),
              render: (i) => i.asset_tag ?? "—",
              accessor: (i) => i.asset_tag ?? null,
              mono: true,
            },
            {
              key: "daily_rate",
              header: t("console.procurement.catalog.column.dailyRate", undefined, "Daily rate"),
              render: (i) => money(i.daily_rate_cents),
              accessor: (i) => i.daily_rate_cents ?? null,
              mono: true,
              tabular: true,
            },
            {
              key: "equipment_state",
              header: t("console.procurement.catalog.column.equipment_state", undefined, "Status"),
              render: (i) => toTitle(i.equipment_state),
              accessor: (i) => i.equipment_state,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
