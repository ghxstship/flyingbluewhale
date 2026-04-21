import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAndValidateCsv } from "@/lib/import/csv";
import { VendorRowSchema, type VendorRow, dedupeKey } from "@/lib/import/transformers/vendors";
import { log } from "@/lib/log";

const PostSchema = z.object({ csv: z.string().min(1).max(5 * 1024 * 1024) });

const MAX_SYNC_ROWS = 1000;

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "procurement:read");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();
    const result = parseAndValidateCsv<VendorRow>(input.csv, VendorRowSchema);
    if (result.rowCount > MAX_SYNC_ROWS) return apiError("bad_request", `Row count ${result.rowCount} exceeds sync cap ${MAX_SYNC_ROWS}`);

    // Cap dedup-lookup at 50k vendors per org — well above any realistic
    // production count; prevents an unbounded scan if a tenant ever
    // approaches that threshold.
    const { data: existing } = await supabase.from("vendors").select("name, contact_email").eq("org_id", session.orgId).limit(50_000);
    const existingKeys = new Set((existing ?? []).map((r) => (r.contact_email ?? r.name).toLowerCase()));

    const dedup = new Map<string, VendorRow>();
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
        contact_email: r.contact_email ?? null,
        contact_phone: r.contact_phone ?? null,
        category: r.category ?? null,
        notes: r.notes ?? null,
      }));
      const { error, data } = await supabase.from("vendors").insert(rowsForDb).select("id");
      if (error) {
        log.warn("import.vendors.insert_failed", { err: error.message, org_id: session.orgId });
        return apiError("internal", error.message);
      }
      insertedCount = data?.length ?? 0;
    }

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
