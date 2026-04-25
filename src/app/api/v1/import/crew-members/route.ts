import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAndValidateCsv } from "@/lib/import/csv";
import { CrewRowSchema, type CrewRow, dedupeKey } from "@/lib/import/transformers/crew";
import { logImportRun } from "@/lib/import/log";
import { log } from "@/lib/log";

/**
 * POST /api/v1/import/crew-members
 *
 * Accepts `{ csv }` — validates rows against CrewRowSchema, dedupes
 * against existing org-scoped crew by email (or (name, phone)),
 * bulk-inserts the new rows into crew_members for the caller's org,
 * and returns a summary.
 *
 * Scope for MVP is conservative: 1000 rows max synchronously. Larger
 * imports should flow through the async job-queue variant
 * (`job_queue.type='import.csv.crew_members'` — follow-up work).
 */

const PostSchema = z.object({
  csv: z.string().min(1).max(5 * 1024 * 1024), // 5 MiB cap on raw text
});

const MAX_SYNC_ROWS = 1000;

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "crew:read");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();

    const result = parseAndValidateCsv<CrewRow>(input.csv, CrewRowSchema);
    if (result.rowCount > MAX_SYNC_ROWS) {
      return apiError(
        "bad_request",
        `Row count ${result.rowCount} exceeds sync cap ${MAX_SYNC_ROWS}. Use the async import path.`,
      );
    }

    // Load existing crew for dedupe. crew_members is org-scoped (no
    // project_id in schema), so we list everything in the org.
    const { data: existing } = await supabase
      .from("crew_members")
      .select("email, name, phone")
      .eq("org_id", session.orgId);
    const existingKeys = new Set(
      (existing ?? []).map((r) =>
        r.email ? r.email : `${r.name}::${r.phone ?? ""}`.toLowerCase(),
      ),
    );

    const dedup = new Map<string, CrewRow>();
    for (const row of result.valid) {
      const key = dedupeKey(row);
      if (existingKeys.has(key)) continue;
      dedup.set(key, row);
    }
    const toInsert = Array.from(dedup.values());

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const rowsForDb = toInsert.map((r) => ({
        org_id: session.orgId,
        name: r.name,
        role: r.role ?? null,
        phone: r.phone ?? null,
        email: r.email ?? null,
        day_rate_cents: r.day_rate_cents ?? null,
        notes: r.notes ?? null,
      }));
      const { error: upErr, data: inserted } = await supabase
        .from("crew_members")
        .insert(rowsForDb)
        .select("id");
      if (upErr) {
        log.warn("import.crew_members.insert_failed", { err: upErr.message, org_id: session.orgId });
        await logImportRun({
          orgId: session.orgId,
          userId: session.userId,
          kind: "crew_members",
          rowsTotal: result.rowCount,
          rowsImported: 0,
          rowsFailed: result.rowCount,
          status: "failed",
          error: upErr.message,
        });
        return apiError("internal", upErr.message);
      }
      insertedCount = inserted?.length ?? 0;
    }

    await logImportRun({
      orgId: session.orgId,
      userId: session.userId,
      kind: "crew_members",
      rowsTotal: result.rowCount,
      rowsImported: insertedCount,
      rowsFailed: result.invalid.length,
      status: "succeeded",
    });

    return apiCreated({
      rowCount: result.rowCount,
      validCount: result.valid.length,
      invalidCount: result.invalid.length,
      insertedCount,
      skippedCount: result.valid.length - insertedCount,
      invalid: result.invalid.slice(0, 50),
    });
  });
}
