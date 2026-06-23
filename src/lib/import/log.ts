import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Log a CSV import run to `import_runs` so /studio/settings/imports can
 * show history. Best-effort: failures here are swallowed; the import
 * itself already returned success/failure to the caller.
 */
export async function logImportRun(args: {
  orgId: string;
  userId: string | null;
  kind: "crew_members" | "tasks" | "vendors";
  rowsTotal: number;
  rowsImported: number;
  rowsFailed: number;
  run_state: "succeeded" | "failed";
  filename?: string | null;
  error?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("import_runs").insert({
      org_id: args.orgId,
      kind: args.kind,
      source: "csv",
      filename: args.filename ?? null,
      rows_total: args.rowsTotal,
      rows_imported: args.rowsImported,
      rows_failed: args.rowsFailed,
      run_state: args.run_state,
      error: args.error ?? null,
      created_by: args.userId,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    });
  } catch {
    // best-effort; import already returned to caller
  }
}
