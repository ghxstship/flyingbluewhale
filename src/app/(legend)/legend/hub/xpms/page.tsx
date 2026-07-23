import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/ui/FilterBar";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { AppOwnershipChip } from "@/components/legend/AppOwnershipChip";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { mergeAtomOverlay, type AtomOverlaySetting } from "@/lib/xpms/atom-overlay";
import { appForDeptCode, isDepartmentApp, type DepartmentApp } from "@/lib/xpms/app-ownership";
import { getRequestT } from "@/lib/i18n/request";
import { AtomEnabledToggle, AtomLabelEditor } from "./AtomOverlayControls";

export const dynamic = "force-dynamic";

/**
 * XPMS Catalog pillar (LEG3ND P4): the org-facing browse surface over the
 * XPMS 2.5 master catalog — the base kit LEG3ND ships, with org-level
 * customizations layered on top.
 *
 * - The catalog (public.xpms_catalog, active atoms) is the immutable SSOT;
 *   the org overlay (org_xpms_atom_settings) carries only enable/disable
 *   flags and label overrides. Disabled atoms stay listed, badged — never
 *   masked (ratcheted in src/lib/xpms/atom-overlay.test.ts).
 * - Department chips are the first real consumer of dim_department.app:
 *   each atom's class is badged with its owning app's brand accent.
 * - Members browse read-only; manager+ get the inline label editor and the
 *   enable/disable toggle.
 */

type CatalogAtom = {
  xpms_atom_id: string;
  name: string;
  common_name: string | null;
  urid: string;
  department: string;
  discipline: string;
  category: string;
  kind: string | null;
  tier: string | null;
};

type DimDept = { code: string; label: string; app: string };

export default async function XpmsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.xpms.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.xpms.title", undefined, "XPMS Catalog")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const canEdit = isManagerPlus(session);
  const db = (await createClient()) as unknown as LooseSupabase;

  // The 10 Bible department classes with their app ownership — the runtime
  // SSOT for the app chips (dim_department.app, migration 20260723030000).
  const { data: dimRows } = await db.from("dim_department").select("code, label, app").order("code");
  const departments = (dimRows ?? []) as DimDept[];
  const appByCode = new Map<string, DepartmentApp>();
  for (const d of departments) if (isDepartmentApp(d.app)) appByCode.set(d.code, d.app);
  const labelByCode = new Map(departments.map((d) => [d.code, d.label]));

  const classFilter = /^\d000$/.test(sp.class ?? "") ? (sp.class as string) : null;

  let query = db
    .from("xpms_catalog")
    .select("xpms_atom_id, name, common_name, urid, department, discipline, category, kind, tier")
    .ilike("catalog_state", "active");
  if (classFilter) query = query.like("urid", `${classFilter.slice(0, 1)}%`);
  const { data: atomRows, error: atomError } = await query.order("urid").order("xpms_atom_id").limit(1000);
  const atoms = (atomRows ?? []) as CatalogAtom[];

  // Org overlay — settings over the catalog. Tolerate the table not existing
  // yet (the migration ships with this surface): no overlay = pure defaults.
  const { data: overlayRows, error: overlayError } = await db
    .from("org_xpms_atom_settings")
    .select("xpms_atom_id, enabled, org_label")
    .eq("org_id", session.orgId);
  const overlay: AtomOverlaySetting[] = overlayError ? [] : ((overlayRows ?? []) as AtomOverlaySetting[]);

  // DataView rows need an `id`; the atom id is the natural key.
  const rows = mergeAtomOverlay(atoms, overlay).map((r) => ({ ...r, id: r.xpms_atom_id }));
  const disabledCount = rows.filter((r) => !r.enabled).length;

  const deptCodeOf = (r: { urid: string }) => `${r.urid.slice(0, 1)}000`;

  const classOptions = departments.map((d) => ({ value: d.code, label: `${d.code} · ${d.label}` }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.xpms.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.xpms.title", undefined, "XPMS Catalog")}
        subtitle={t(
          "console.legend.hub.xpms.subtitle",
          { count: rows.length, disabled: disabledCount },
          `The XPMS 2.5 base kit: ${rows.length} atoms across the ten department classes. Your overrides layer on top; the catalog itself never changes.`,
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.xpms.title", undefined, "XPMS Catalog") },
        ]}
      />
      <div className="page-content">
        <FilterBar
          clearLabel={t("console.legend.hub.xpms.filter.clear", undefined, "Clear")}
          resultCount={rows.length}
          facets={[
            {
              param: "class",
              label: t("console.legend.hub.xpms.filter.class", undefined, "Class"),
              allLabel: t("console.legend.hub.xpms.filter.allClasses", undefined, "All classes"),
              options: classOptions,
            },
          ]}
        />
        {atomError ? (
          <div className="surface p-4 text-sm">
            {t(
              "console.legend.hub.xpms.loadError",
              { message: atomError.message },
              `Could not load the catalog: ${atomError.message}`,
            )}
          </div>
        ) : null}
        <DataView<(typeof rows)[number]>
          tableId="legend.hub.xpms"
          rows={rows}
          searchable
          emptyLabel={t("console.legend.hub.xpms.emptyLabel", undefined, "No atoms match")}
          emptyDescription={t(
            "console.legend.hub.xpms.emptyDescription",
            undefined,
            "The master catalog seeds with the XPMS 2.5 base kit. Clear the class filter to see all atoms.",
          )}
          columns={[
            {
              key: "atom",
              header: t("console.legend.hub.xpms.columns.atom", undefined, "Atom"),
              render: (r) => r.xpms_atom_id,
              accessor: (r) => r.xpms_atom_id,
              mono: true,
              sortable: true,
            },
            {
              key: "label",
              header: t("console.legend.hub.xpms.columns.label", undefined, "Label"),
              render: (r) =>
                canEdit ? (
                  <AtomLabelEditor atomId={r.xpms_atom_id} canonicalName={r.name} orgLabel={r.orgLabel} />
                ) : (
                  <span className="text-xs" title={r.orgLabel ? r.name : undefined}>
                    {r.displayName}
                  </span>
                ),
              accessor: (r) => r.displayName,
              sortable: true,
            },
            {
              key: "department",
              header: t("console.legend.hub.xpms.columns.department", undefined, "Department"),
              render: (r) => {
                const code = deptCodeOf(r);
                const app = appByCode.get(code) ?? appForDeptCode(code);
                const label = labelByCode.get(code) ?? r.department;
                return (
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="ps-id text-[var(--p-text-2)]">{code}</span>
                    {label}
                    {app ? <AppOwnershipChip app={app} title={`${code} ${label}`} /> : null}
                  </span>
                );
              },
              accessor: (r) => `${deptCodeOf(r)} ${labelByCode.get(deptCodeOf(r)) ?? r.department}`,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "discipline",
              header: t("console.legend.hub.xpms.columns.discipline", undefined, "Discipline"),
              render: (r) => (
                <span className="text-xs">
                  {r.discipline}
                  <span className="ms-1 text-[var(--p-text-3)]">· {r.category}</span>
                </span>
              ),
              accessor: (r) => `${r.discipline} ${r.category}`,
              sortable: true,
              filterable: true,
            },
            {
              key: "kind",
              header: t("console.legend.hub.xpms.columns.kind", undefined, "Kind"),
              render: (r) => r.kind ?? "—",
              accessor: (r) => r.kind ?? "",
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "enabled",
              header: t("console.legend.hub.xpms.columns.enabled", undefined, "Availability"),
              render: (r) =>
                canEdit ? (
                  <AtomEnabledToggle atomId={r.xpms_atom_id} enabled={r.enabled} />
                ) : r.enabled ? (
                  <Badge variant="success">{t("console.legend.hub.xpms.enabled", undefined, "Enabled")}</Badge>
                ) : (
                  <Badge variant="muted">{t("console.legend.hub.xpms.disabled", undefined, "Disabled")}</Badge>
                ),
              accessor: (r) => (r.enabled ? "enabled" : "disabled"),
              sortable: true,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
