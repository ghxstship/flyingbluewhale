import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { rowsToCsv } from "./csv";
import { rowsToJson } from "./json";
import { rowsToZipBuffer, type ZipEntry } from "./zip";
import { EXPORT_REGISTRY } from "../registry";

/**
 * Project archive — Opportunity #9.
 *
 * Builds a single ZIP that contains:
 *   - manifest.json            meta + table inventory + row counts
 *   - tables/<table>.csv       every org-scoped table's project rows
 *   - tables/<table>.json      same, JSON envelope
 *
 * Scope is `project_id = :projectId`. Tables that DON'T carry project_id
 * (e.g. crew_members) are exported whole-org. Audit_log is excluded
 * from the default archive (file size + sensitivity — use #15 compliance
 * export for it explicitly).
 */

const SKIP_FROM_ARCHIVE = new Set(["audit_log"]);

 
type AnySupabase = SupabaseClient<any, any, any>;

export async function buildProjectArchive(args: {
  supabase: AnySupabase;
  orgId: string;
  orgName: string;
  projectId: string;
  projectName: string;
}): Promise<Buffer> {
  const entries: ZipEntry[] = [];
  const tableCounts: Record<string, number> = {};

  for (const [table, meta] of Object.entries(EXPORT_REGISTRY)) {
    if (SKIP_FROM_ARCHIVE.has(table)) continue;
     
    let q = (args.supabase.from(table) as any).select("*");
    // Narrow the registry-whitelisted tables with a project filter when
    // they have one; otherwise keep the full org scope.
    if (meta.orgScoped) q = q.eq("org_id", args.orgId);
    q = q.limit(10_000);

    const { data, error } = await q;
    if (error) continue;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    // Apply project filter when the table has a project_id column.
    const projectRows = rows.filter((r) => !("project_id" in r) || r.project_id === args.projectId);
    tableCounts[table] = projectRows.length;

    entries.push({
      name: `tables/${table}.csv`,
      content: rowsToCsv(projectRows, meta.csvColumns),
    });
    entries.push({
      name: `tables/${table}.json`,
      content: rowsToJson({ orgId: args.orgId, kind: table, rows: projectRows }),
    });
  }

  entries.push({
    name: "manifest.json",
    content: JSON.stringify(
      {
        kind: "project_archive",
        exported_at: new Date().toISOString(),
        org: { id: args.orgId, name: args.orgName },
        project: { id: args.projectId, name: args.projectName },
        tables: tableCounts,
      },
      null,
      2,
    ),
  });

  return rowsToZipBuffer(entries);
}
