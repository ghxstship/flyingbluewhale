import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASS_BY_CODE, XPMS_PHASES, formatXtcCode } from "@/lib/xpms";
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

const PHASE_NUM = Object.fromEntries(XPMS_PHASES.map((p) => [p.id, p.num]));

export default async function AtomsPage() {
  const { t } = await getRequestT();
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
  const { data, error } = await supabase
    .from("xpms_atoms")
    .select("id, identifier, name, state, phase, class_code, xtc_code, cost_cents, currency, quantity, unit")
    .eq("org_id", session.orgId)
    .order("class_code")
    .order("identifier")
    .limit(500);
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
        {error ? (
          <div className="surface p-4 text-sm">
            {t("console.xpms.atoms.loadError", { message: error.message }, `Could not load atoms: ${error.message}`)}
          </div>
        ) : null}
        <DataTable<AtomRow>
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
              className: "font-mono text-[11px]",
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
              className: "font-mono text-[11px]",
              sortable: true,
            },
            {
              key: "phase",
              header: t("console.xpms.atoms.columns.phase", undefined, "Phase"),
              render: (r) => (
                <span className="text-xs">
                  <span className="me-1 font-mono text-[10px] text-[var(--text-muted)]">
                    {PHASE_NUM[r.phase] ?? "?"}
                  </span>
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
                <span className="font-mono text-xs">
                  {r.quantity ?? 1}
                  {r.unit ? <span className="ms-1 text-[var(--text-muted)]">{r.unit}</span> : null}
                </span>
              ),
              accessor: (r) => Number(r.quantity ?? 1),
              sortable: true,
              className: "text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
