export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ImportForm } from "./ImportForm";

/**
 * Import Centre — Opportunity #7 UI surface.
 * Three targets shipped: crew roster, vendors, project tasks.
 */

export default async function ImportsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Imports" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("import_runs")
    .select("id, kind, source, filename, rows_total, rows_imported, rows_failed, status, error, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Imports"
      />
      <div className="page-content max-w-4xl space-y-6">
        <section className="surface p-5">
          <ImportForm />
        </section>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Recent runs
          </h3>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Source</th>
                  <th>Imported</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {(runs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                      No imports yet.
                    </td>
                  </tr>
                ) : (
                  (runs ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs">{r.kind}</td>
                      <td className="text-xs text-[var(--text-secondary)]">
                        {r.filename ?? r.source}
                      </td>
                      <td className="font-mono text-xs">{r.rows_imported}</td>
                      <td className="font-mono text-xs">{r.rows_failed}</td>
                      <td>
                        <Badge
                          variant={
                            r.status === "succeeded"
                              ? "success"
                              : r.status === "failed"
                                ? "error"
                                : "muted"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5 text-sm text-[var(--text-muted)]">
          <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Column reference</h3>
          <p><strong>crew-members:</strong> name (required), role, phone, email, day_rate_cents, notes</p>
          <p><strong>tasks:</strong> title (required), description, status (todo|in_progress|review|blocked|done), priority (0-5), due_at (ISO)</p>
          <p><strong>vendors:</strong> name (required), contact_email, contact_phone, category, notes</p>
        </section>
      </div>
    </>
  );
}
