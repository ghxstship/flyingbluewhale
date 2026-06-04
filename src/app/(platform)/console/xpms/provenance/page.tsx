import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Edge = {
  id: string;
  kind: string;
  from_atom_id: string;
  to_atom_id: string;
  created_at: string;
};

export default async function ProvenancePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.provenance.title", undefined, "Provenance Graph")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.provenance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("xpms_provenance_edges")
    .select("id, kind, from_atom_id, to_atom_id, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const edges = (data ?? []) as Edge[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.xpms.provenance.eyebrow", undefined, "XPMS · Provenance")}
        title={t("console.xpms.provenance.title", undefined, "Provenance Graph")}
        subtitle={
          edges.length === 1
            ? t("console.xpms.provenance.subtitleOne", { count: edges.length }, `${edges.length} Edge`)
            : t("console.xpms.provenance.subtitleOther", { count: edges.length }, `${edges.length} Edges`)
        }
      />
      <div className="page-content">
        <DataTable<Edge>
          tableId="xpms.provenance"
          rows={edges}
          searchable
          emptyLabel={t("console.xpms.provenance.emptyLabel", undefined, "No provenance edges yet")}
          emptyDescription={t(
            "console.xpms.provenance.emptyDescription",
            undefined,
            "Edges appear as records reference each other across classes — assignments, authoring, and downstream consumers.",
          )}
          columns={[
            {
              key: "kind",
              header: t("console.xpms.provenance.columns.edge", undefined, "Edge"),
              render: (e) => <Badge variant="info">{toTitle(e.kind)}</Badge>,
              accessor: (e) => e.kind,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "from",
              header: t("console.xpms.provenance.columns.fromAtom", undefined, "From atom"),
              render: (e) => e.from_atom_id,
              accessor: (e) => e.from_atom_id,
              className: "font-mono text-[10px]",
              sortable: true,
            },
            {
              key: "to",
              header: t("console.xpms.provenance.columns.toAtom", undefined, "To atom"),
              render: (e) => e.to_atom_id,
              accessor: (e) => e.to_atom_id,
              className: "font-mono text-[10px]",
              sortable: true,
            },
            {
              key: "created",
              header: t("console.xpms.provenance.columns.created", undefined, "Created"),
              render: (e) => fmt.dateTime(e.created_at),
              accessor: (e) => e.created_at,
              className: "text-xs text-[var(--text-muted)]",
              sortable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
