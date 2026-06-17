import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ImportJob, ImportJobState, ImportResource, ImportRowError } from "@/lib/import/types";
import type { TablesUpdate } from "@/lib/supabase/types";

function rowToImportJob(r: Record<string, unknown>): ImportJob {
  return {
    id: r.id as string,
    orgId: r.org_id as string,
    resource: r.resource as ImportResource,
    source: (r.source as ImportJob["source"]) ?? "csv",
    sourceLabel: (r.source_label as string | null) ?? null,
    storagePath: (r.storage_path as string | null) ?? null,
    state: (r.state as ImportJobState) ?? "pending",
    rowsTotal: Number(r.rows_total ?? 0),
    rowsSucceeded: Number(r.rows_succeeded ?? 0),
    rowsFailed: Number(r.rows_failed ?? 0),
    errors: Array.isArray(r.errors) ? (r.errors as ImportRowError[]) : [],
    summary: (r.summary as string | null) ?? null,
    jobId: (r.job_id as string | null) ?? null,
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
  };
}

export async function listImportJobs(opts: { orgId: string; limit?: number } = { orgId: "" }): Promise<ImportJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("org_id", opts.orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(rowToImportJob);
}

export async function getImportJob(opts: { id: string; orgId: string }): Promise<ImportJob | null> {
  const supabase = await createClient();
  // org_id pin on top of RLS — defense-in-depth, and required because the
  // sibling create/update path runs under the service-role client (RLS off).
  const { data } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", opts.id)
    .eq("org_id", opts.orgId)
    .maybeSingle();
  return data ? rowToImportJob(data as Record<string, unknown>) : null;
}

export async function createImportJob(opts: {
  orgId: string;
  resource: ImportResource;
  source: ImportJob["source"];
  sourceLabel?: string;
  storagePath?: string;
  createdBy: string;
}): Promise<ImportJob> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("import_jobs")
    .insert({
      org_id: opts.orgId,
      resource: opts.resource,
      source: opts.source,
      source_label: opts.sourceLabel ?? null,
      storage_path: opts.storagePath ?? null,
      state: "pending",
      created_by: opts.createdBy,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create import job");
  return rowToImportJob(data as Record<string, unknown>);
}

export async function updateImportJob(opts: {
  id: string;
  orgId: string;
  state?: ImportJobState;
  rowsTotal?: number;
  rowsSucceeded?: number;
  rowsFailed?: number;
  errors?: ImportRowError[];
  summary?: string;
  startedAt?: string;
  finishedAt?: string;
}): Promise<void> {
  const admin = createServiceClient();
  const patch: TablesUpdate<"import_jobs"> = {};
  if (opts.state !== undefined) patch.state = opts.state;
  if (opts.rowsTotal !== undefined) patch.rows_total = opts.rowsTotal;
  if (opts.rowsSucceeded !== undefined) patch.rows_succeeded = opts.rowsSucceeded;
  if (opts.rowsFailed !== undefined) patch.rows_failed = opts.rowsFailed;
  if (opts.errors !== undefined) patch.errors = opts.errors.slice(0, 100);
  if (opts.summary !== undefined) patch.summary = opts.summary;
  if (opts.startedAt !== undefined) patch.started_at = opts.startedAt;
  if (opts.finishedAt !== undefined) patch.finished_at = opts.finishedAt;
  // org_id pin: the service-role client bypasses RLS, so a wrong/stale id must
  // never be able to write across tenants — scope the UPDATE to the owner org.
  await admin.from("import_jobs").update(patch).eq("id", opts.id).eq("org_id", opts.orgId);
}
