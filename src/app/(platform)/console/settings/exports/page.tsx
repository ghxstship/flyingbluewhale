export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewExportForm } from "./NewExportForm";

/**
 * Export Centre — Opportunity #8 UI surface.
 * Lists the caller org's recent `export_runs` + a form to kick off a
 * new export against any whitelisted table in `EXPORT_REGISTRY`.
 */

export default async function ExportsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("export_runs")
    .select("id, kind, params, status, size_bytes, row_count, created_at, completed_at, last_error")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Export Centre"
        subtitle="Pull any org-scoped table as CSV, JSON, XLSX, or a ZIP bundle."
      />
      <div className="page-content space-y-8 max-w-5xl">
        <section className="surface p-5">
          <h2 className="text-sm font-semibold mb-3">New export</h2>
          <NewExportForm />
        </section>
        <section className="surface p-5">
          <h2 className="text-sm font-semibold mb-3">Recent runs</h2>
          {runs && runs.length > 0 ? (
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Kind</th>
                  <th>Table</th>
                  <th>Rows</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const params = (r.params ?? {}) as { table?: string; projectId?: string };
                  return (
                    <tr key={r.id}>
                      <td className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="uppercase">{r.kind}</td>
                      <td>{params.table ?? "—"}</td>
                      <td className="font-mono text-xs">{r.row_count ?? "—"}</td>
                      <td>{r.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No exports yet. Run one above to see it here.</p>
          )}
        </section>
      </div>
    </>
  );
}
