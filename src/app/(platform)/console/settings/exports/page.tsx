export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ExportCenter } from "./ExportCenter";

/**
 * Export Centre — Opportunity #8 UI surface.
 * Polls in-flight export_runs + offers re-download of completed files.
 */

export default async function ExportsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("export_runs")
    .select("id, kind, params, status, file_path, size_bytes, row_count, created_at, completed_at, last_error")
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
      <div className="page-content max-w-5xl">
        <ExportCenter initial={(runs ?? []) as never} />
      </div>
    </>
  );
}
