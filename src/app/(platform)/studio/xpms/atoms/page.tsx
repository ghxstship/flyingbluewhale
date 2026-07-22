import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { MONO_CELL_CLASS } from "@/components/views/data-view-model";
import { Badge } from "@/components/ui";
import { FilterBar } from "@/components/ui/FilterBar";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASSES, XPMS_CLASS_BY_CODE, XPMS_ATOM_PHASES, formatXtcCode, type XpmsAtomPhase } from "@/lib/xpms";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AtomRow = {
  id: string;
  identifier: string;
  name: string;
  state: "uac" | "tpc";
  phase: string;
  class_code: number;
  xtc_code: number;
  cost_cents: number | null;
  currency: string | null;
  quantity: number | null;
  unit: string | null;
};

const PHASE_NUM = Object.fromEntries(XPMS_ATOM_PHASES.map((p) => [p.id, p.num]));

export default async function AtomsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; phase?: string }>;
}) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.atoms.title", undefined, "Atoms")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.atoms.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  // §9 Class × Phase coordinate facet — shareable, server-side filter.
  const classFilter = sp.class != null && sp.class !== "" ? Number(sp.class) : null;
  const phaseFilter =
    sp.phase && XPMS_ATOM_PHASES.some((p) => p.id === sp.phase) ? (sp.phase as XpmsAtomPhase) : null;
  let query = supabase
    .from("xpms_atoms")
    .select("id, identifier, name, state, phase, class_code, xtc_code, cost_cents, currency, quantity, unit")
    .eq("org_id", session.orgId);
  if (classFilter != null && Number.isInteger(classFilter)) query = query.eq("class_code", classFilter);
  if (phaseFilter) query = query.eq("phase", phaseFilter);
  const { data, error } = await query.order("class_code").order("identifier").limit(500);
  const rows = (data ?? []) as AtomRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.xpms.atoms.eyebrow", undefined, "XPMS · Atomic Production System")}
        title={t("console.xpms.atoms.title", undefined, "Atoms")}
        subtitle={t(
          "console.xpms.atoms.subtitle",
          { count: rows.length },
          `${rows.length} addressable units across the ten classes`,
        )}
      />
      <div className="page-content">
        <FilterBar
          clearLabel={t("console.xpms.atoms.filter.clear", undefined, "Clear")}
          resultCount={rows.length}
          facets={[
            {
              param: "class",
              label: t("console.xpms.atoms.filter.class", undefined, "Class"),
              allLabel: t("console.xpms.atoms.filter.allClasses", undefined, "All classes"),
              options: XPMS_CLASSES.map((c) => ({ value: String(c.code), label: `${c.code} · ${c.name}` })),
            },
            {
              param: "phase",
              label: t("console.xpms.atoms.filter.phase", undefined, "Phase"),
              allLabel: t("console.xpms.atoms.filter.allPhases", undefined, "All phases"),
              options: XPMS_ATOM_PHASES.map((p) => ({ value: p.id, label: `${p.num} · ${p.label}` })),
            },
          ]}
        />
        {error ? (
          <div className="surface p-4 text-sm">
            {t("console.xpms.atoms.loadError", { message: error.message }, `Could not load atoms: ${error.message}`)}
          </div>
        ) : null}
        <DataView<AtomRow>
          tableId="xpms.atoms"
          rows={rows}
          searchable
          emptyLabel={t("console.xpms.atoms.emptyLabel", undefined, "No atoms yet")}
          emptyDescription={t(
            "console.xpms.atoms.emptyDescription",
            undefined,
            "Crew, equipment, scenic, and other production rows promote to atoms automatically once they carry an XTC code.",
          )}
          columns={[
            {
              key: "identifier",
              header: t("console.xpms.atoms.columns.identifier", undefined, "Identifier"),
              render: (r) => r.identifier,
              accessor: (r) => r.identifier,
              mono: true,
              sortable: true,
            },
            {
              key: "name",
              header: t("console.xpms.atoms.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
              className: "text-xs",
              sortable: true,
            },
            {
              key: "class",
              header: t("console.xpms.atoms.columns.class", undefined, "Class"),
              render: (r) => {
                const cls = XPMS_CLASS_BY_CODE[r.class_code];
                return cls ? <span style={{ color: cls.accent }}>{cls.name}</span> : <>{r.class_code}</>;
              },
              accessor: (r) => XPMS_CLASS_BY_CODE[r.class_code]?.name ?? String(r.class_code),
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "xtc",
              header: t("console.xpms.atoms.columns.xtc", undefined, "XTC"),
              render: (r) => formatXtcCode(r.xtc_code),
              accessor: (r) => r.xtc_code,
              mono: true,
              sortable: true,
            },
            {
              key: "phase",
              header: t("console.xpms.atoms.columns.phase", undefined, "Phase"),
              render: (r) => (
                <span className="text-xs">
                  <span className={`me-1 ${MONO_CELL_CLASS} text-[var(--p-text-2)]`}>{PHASE_NUM[r.phase] ?? "?"}</span>
                  {r.phase}
                </span>
              ),
              accessor: (r) => `${PHASE_NUM[r.phase] ?? 0}-${r.phase}`,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("console.xpms.atoms.columns.state", undefined, "State"),
              render: (r) => <Badge variant={r.state === "tpc" ? "success" : "info"}>{r.state.toUpperCase()}</Badge>,
              accessor: (r) => r.state,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "qty",
              header: t("console.xpms.atoms.columns.qty", undefined, "Qty"),
              render: (r) => (
                <span>
                  {r.quantity ?? 1}
                  {r.unit ? <span className="ms-1 text-[var(--p-text-2)]">{r.unit}</span> : null}
                </span>
              ),
              accessor: (r) => Number(r.quantity ?? 1),
              sortable: true,
              numeric: true,
            },
          ]}
        />
      </div>
    </>
  );
}
