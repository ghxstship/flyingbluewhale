import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

// Heuristic — gear whose category matches one of these is treated as AV.
// Tag a piece of equipment with a more specific category to surface here.
const AV_CATEGORY_PATTERN = /(av|audio|video|lighting|sound|scoreboard|broadcast|projection|led|camera|mic)/i;

type EquipmentRow = {
  id: string;
  name: string;
  asset_tag: string | null;
  category: string | null;
  equipment_state: string;
  serial: string | null;
  notes: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.av.eyebrow", undefined, "Production")}
          title={t("console.production.av.title", undefined, "AV Systems")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.av.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("id, name, asset_tag, category, equipment_state, serial, notes")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(1000);
  const all = (data ?? []) as EquipmentRow[];
  const av = all.filter((e) => e.category && AV_CATEGORY_PATTERN.test(e.category));

  // Aggregate by category for a quick split
  const byCat = av.reduce<Record<string, number>>((acc, r) => {
    const k = r.category ?? "—";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.av.eyebrow", undefined, "Production")}
        title={t("console.production.av.title", undefined, "AV Systems")}
        subtitle={`${av.length} ${av.length === 1 ? t("console.production.av.assetSingular", undefined, "AV asset") : t("console.production.av.assetPlural", undefined, "AV assets")} · ${catEntries.length} ${catEntries.length === 1 ? t("console.production.av.categorySingular", undefined, "category") : t("console.production.av.categoryPlural", undefined, "categories")}`}
        action={
          <Button href="/console/production/equipment/new" size="sm">
            {t("console.production.av.newAvSetup", undefined, "+ New AV Setup")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {catEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">{t("console.production.av.byCategory", undefined, "By Category")}</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {catEntries.map(([cat, count]) => (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--p-text-2)]">{cat}</span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<EquipmentRow>
          rows={av}
          rowHref={(r) => `/console/production/equipment/${r.id}`}
          emptyLabel={t("console.production.av.emptyLabel", undefined, "No AV assets identified")}
          emptyDescription={t(
            "console.production.av.emptyDescription",
            undefined,
            "AV assets are equipment whose category matches AV / audio / video / lighting / sound / scoreboard / broadcast / projection / LED / camera / mic. Tag your gear's category to surface it here.",
          )}
          emptyAction={
            <Button href="/console/production/equipment/new" size="sm">
              {t("console.production.av.newAvSetup", undefined, "+ New AV Setup")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.production.av.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "asset_tag",
              header: t("console.production.av.columns.tag", undefined, "Tag"),
              render: (r) => <span className="font-mono text-xs">{r.asset_tag ?? "—"}</span>,
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "category",
              header: t("console.production.av.columns.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "serial",
              header: t("console.production.av.columns.serial", undefined, "Serial"),
              render: (r) => <span className="font-mono text-xs">{r.serial ?? "—"}</span>,
              accessor: (r) => r.serial ?? null,
            },
            {
              key: "equipment_state",
              header: t("console.production.av.columns.equipment_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.equipment_state} />,
              accessor: (r) => r.equipment_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.production.av.footnotePrefix",
            undefined,
            "AV is a category-filtered slice of the broader equipment list. To bring an asset here, set its category to something matching the AV pattern (e.g. ",
          )}
          <code>audio</code>, <code>lighting</code>, <code>scoreboard</code>
          {t("console.production.av.footnoteSuffix", undefined, ").")}
        </p>
      </div>
    </>
  );
}
