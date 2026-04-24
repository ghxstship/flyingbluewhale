import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { EXPORT_REGISTRY, isExportTable, type ExportTable } from "@/lib/export/registry";
import { rowsToCsv } from "@/lib/export/strategies/csv";
import { rowsToJson } from "@/lib/export/strategies/json";
import { rowsToXlsxBuffer } from "@/lib/export/strategies/xlsx";
import { rowsToZipBuffer } from "@/lib/export/strategies/zip";
import { log } from "@/lib/log";

/**
 * Unified Export Centre — Opportunity #8.
 *
 * POST: kick off a synchronous export for small tables; for larger ones
 *       the caller should pass `async: true` and poll the run row. The
 *       MVP path here is synchronous — we keep request/response within
 *       the statement_timeout (H3-05 = 10s for authenticated) and rely
 *       on the fact that most single-table dumps are well under that.
 * GET:  list this org's recent export runs (paginated, newest first).
 */

const PostSchema = z.object({
  kind: z.enum(["csv", "json", "xlsx", "zip"]),
  table: z.string().min(1).max(64),
  async: z.boolean().optional(),           // reserved for job-queue follow-up
  projectId: z.string().uuid().optional(), // optional scope narrower than org
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  if (!isExportTable(input.table)) {
    return apiError("bad_request", `Unsupported table: ${input.table}`);
  }
  const table = input.table as ExportTable;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:read");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();
    const meta = EXPORT_REGISTRY[table];

    // Build the query against the registry. RLS enforces org scoping on
    // org_scoped tables; we add an explicit filter on tables that lack
    // their own org_id column (e.g. invoice_line_items joins through
    // invoice_id — we skip those non-trivial cases in the MVP).
    if (!meta.orgScoped) {
      return apiError("bad_request", `Table "${table}" is not directly org-scoped; use a joined export instead.`);
    }

    // Async path — enqueue an `export.package` job and return the run row
    // immediately so the UI can poll. Only CSV + JSON are supported by
    // the worker today (see supabase/functions/job-worker/index.ts);
    // XLSX + ZIP still go through the sync branch below.
    if (input.async && (input.kind === "csv" || input.kind === "json")) {
        if (!isServiceClientAvailable()) {
          return apiError(
            "service_unavailable",
            "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
          );
        }
      const svc = createServiceClient();
      const { data: run, error: runErr } = await supabase
        .from("export_runs")
        .insert({
          org_id: session.orgId,
          kind: input.kind,
          params: { table, projectId: input.projectId ?? null },
          status: "pending",
          requested_by: session.userId,
        })
        .select("id, status, kind, created_at")
        .single();
      if (runErr) return apiError("internal", runErr.message);
      const { error: qErr } = await (svc.from("job_queue") as unknown as {
        insert: (p: Record<string, unknown>) => Promise<{ error: unknown }>;
      }).insert({
        type: "export.package",
        org_id: session.orgId,
        payload: { exportRunId: run.id },
        dedup_key: `export.package:${run.id}`,
      });
      if (qErr) {
        log.warn("exports.enqueue_failed", { err: (qErr as { message?: string }).message });
        return apiError("internal", "Failed to enqueue export job");
      }
      return apiCreated({ run, signedUrl: null, queued: true });
    }

    // Dynamic table lookup — the Supabase client types collapse to
    // `never` across the 9-table union here, so we drop to `any` for
    // the chain and reassert at the consume site. Same escape hatch
    // that lib/db/resource.ts uses.
     
    let q = (supabase.from(table) as any).select("*").eq("org_id", session.orgId);
    if (input.projectId) q = q.eq("project_id", input.projectId);

    const { data, error } = await q.limit(10_000);
    if (error) return apiError("internal", error.message);
    const rows = data ?? [];

    let bytes: Buffer;
    let contentType: string;
    const ext = input.kind;
    const typedRows = rows as Array<Record<string, unknown>>;

    if (input.kind === "csv") {
      bytes = Buffer.from(rowsToCsv(typedRows, meta.csvColumns), "utf8");
      contentType = "text/csv; charset=utf-8";
    } else if (input.kind === "json") {
      bytes = Buffer.from(rowsToJson({ orgId: session.orgId, kind: table, rows }), "utf8");
      contentType = "application/json";
    } else if (input.kind === "xlsx") {
      bytes = await rowsToXlsxBuffer({
        sheetName: meta.label,
        orgName: session.orgId,
        rows: typedRows,
        columns: meta.csvColumns,
      });
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      // zip: bundle CSV + JSON of the same rows
      bytes = await rowsToZipBuffer([
        { name: `${table}.csv`, content: rowsToCsv(typedRows, meta.csvColumns) },
        { name: `${table}.json`, content: rowsToJson({ orgId: session.orgId, kind: table, rows }) },
      ]);
      contentType = "application/zip";
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${session.orgId}/${table}-${stamp}.${ext}`;

    // Upload via service role to the `exports` bucket so the same path
    // is reachable later by the run row's signed-URL fetcher.
    const svc = createServiceClient();
    const { error: upErr } = await svc.storage.from("exports").upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (upErr) return apiError("internal", upErr.message);

    // Record the run.
    const { data: run, error: runErr } = await supabase
      .from("export_runs")
      .insert({
        org_id: session.orgId,
        kind: input.kind,
        params: { table, projectId: input.projectId ?? null },
        status: "done",
        file_path: path,
        size_bytes: bytes.byteLength,
        row_count: rows.length,
        requested_by: session.userId,
        completed_at: new Date().toISOString(),
      })
      .select("id, file_path, size_bytes, row_count, created_at")
      .single();
    if (runErr) {
      log.warn("exports.run_insert_failed", { err: runErr.message });
    }

    // Issue a signed URL so the UI can redirect to the download immediately.
    const { data: urlData } = await svc.storage
      .from("exports")
      .createSignedUrl(path, 300, { download: path.split("/").pop()! });

    return apiCreated({
      run: run ?? null,
      signedUrl: urlData?.signedUrl ?? null,
      contentType,
      size_bytes: bytes.byteLength,
      row_count: rows.length,
    });
  });
}

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("export_runs")
      .select("id, kind, params, status, file_path, size_bytes, row_count, created_at, completed_at, last_error")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk({ runs: data ?? [] });
  });
}
