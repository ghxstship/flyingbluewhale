import { ModuleHeader } from "@/components/Shell";
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
        {edges.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--text-muted)]">
            No provenance edges recorded yet. Edges materialise when atoms reference each other — an Operations atom
            assigned to a Production atom, a Creative atom referencing Build atoms, a TPC atom tracing back to its UAC
            origin.
          </div>
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Edge</th>
                <th className="text-left">From atom</th>
                <th className="text-left">To atom</th>
                <th className="text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Badge variant="info">{e.kind}</Badge>
                  </td>
                  <td className="font-mono text-[10px]">{e.from_atom_id}</td>
                  <td className="font-mono text-[10px]">{e.to_atom_id}</td>
                  <td className="text-xs text-[var(--text-muted)]">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
