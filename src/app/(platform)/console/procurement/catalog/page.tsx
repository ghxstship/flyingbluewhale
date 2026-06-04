export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toTitle } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

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
    .select("id, name, category, asset_tag, daily_rate_cents, status")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("status", "retired")
    .order("category", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    category: string | null;
    asset_tag: string | null;
    daily_rate_cents: number | null;
    status: string;
  }>;
  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.category ?? t("console.procurement.catalog.uncategorized", undefined, "Uncategorized");
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }
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
            categoryCount: grouped.size,
            categoryLabel: grouped.size === 1 ? "category" : "categories",
          },
          `${rows.length} Item${rows.length === 1 ? "" : "s"} across ${grouped.size} categor${grouped.size === 1 ? "y" : "ies"}`,
        )}
      />
      <div className="page-content max-w-5xl space-y-4">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.procurement.catalog.empty.title", undefined, "No Items in the Catalog Yet")}
            description={t(
              "console.procurement.catalog.empty.description",
              undefined,
              "Add equipment via the Production module or bulk-import through Settings → Imports. Every non-retired item appears here as a SKU.",
            )}
            action={
              <Link className="text-sm text-[var(--org-primary)]" href="/console/production/equipment">
                {t("console.procurement.catalog.empty.cta", undefined, "Go to Equipment →")}
              </Link>
            }
          />
        ) : (
          Array.from(grouped.entries()).map(([cat, items]) => (
            <section key={cat} className="surface">
              <div className="border-b border-[var(--border-color)] px-5 py-3">
                <div className="text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">{cat}</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t(
                    "console.procurement.catalog.itemCount",
                    { count: items.length, label: items.length === 1 ? "item" : "items" },
                    `${items.length} item${items.length === 1 ? "" : "s"}`,
                  )}
                </div>
              </div>
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.procurement.catalog.column.name", undefined, "Name")}</th>
                    <th>{t("console.procurement.catalog.column.assetTag", undefined, "Asset tag")}</th>
                    <th>{t("console.procurement.catalog.column.dailyRate", undefined, "Daily rate")}</th>
                    <th>{t("console.procurement.catalog.column.status", undefined, "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/console/production/equipment/${i.id}`} className="hover:underline">
                          {i.name}
                        </Link>
                      </td>
                      <td className="font-mono text-xs">{i.asset_tag ?? "—"}</td>
                      <td className="font-mono text-xs">{money(i.daily_rate_cents)}</td>
                      <td className="font-mono text-xs">{toTitle(i.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
