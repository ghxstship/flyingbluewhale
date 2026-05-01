import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Edge = {
  id: string;
  kind: string;
  from_atom_id: string;
  to_atom_id: string;
  created_at: string;
};

export default async function ProvenancePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Provenance Graph" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
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
        eyebrow="XPMS · Provenance"
        title="Provenance Graph"
        subtitle="Cross-class edges. Every TPC atom traces back to its UAC origin, assigned people, authoring documents, and downstream consumers."
      />
      <div className="page-content">
        <DataTable<Edge>
          tableId="xpms.provenance"
          rows={edges}
          searchable
          emptyLabel="No provenance edges yet"
          emptyDescription="Edges materialise when atoms reference each other — an Operations atom assigned to a Production atom, a Creative atom referencing Build atoms, a TPC atom tracing back to its UAC origin."
          columns={[
            {
              key: "kind",
              header: "Edge",
              render: (e) => <Badge variant="info">{e.kind}</Badge>,
              accessor: (e) => e.kind,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "from",
              header: "From atom",
              render: (e) => e.from_atom_id,
              accessor: (e) => e.from_atom_id,
              className: "font-mono text-[10px]",
              sortable: true,
            },
            {
              key: "to",
              header: "To atom",
              render: (e) => e.to_atom_id,
              accessor: (e) => e.to_atom_id,
              className: "font-mono text-[10px]",
              sortable: true,
            },
            {
              key: "created",
              header: "Created",
              render: (e) => new Date(e.created_at).toLocaleString(),
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
