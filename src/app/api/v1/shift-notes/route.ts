import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { withIdempotency } from "@/lib/idempotency";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/shift-notes — notes hung off time_entries. Reuses the `time` scope domain. */

const CreateSchema = z.object({
  timeEntryId: z.string().uuid(),
  body: z.string().min(1).max(8000),
  asManager: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const pageSizeParam = url.searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : undefined;
  const timeEntryId = url.searchParams.get("timeEntryId");
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "time:read");
    if (denied) return denied;
    const page = await listOrgScopedPage("shift_notes", session.orgId, {
      cursor,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
      orderBy: "created_at",
      ascending: false,
      filters: timeEntryId ? [{ column: "time_entry_id", op: "eq", value: timeEntryId }] : undefined,
    });
    return apiOk(
      {
        orgId: session.orgId,
        shiftNotes: page.rows,
        nextCursor: page.nextCursor,
        pageSize: page.pageSize,
        totalCount: page.totalCount,
      },
      { headers: { "x-total-count": String(page.totalCount) } },
    );
  });
}

// Wrapped with `withIdempotency` so client retries don't create duplicate
// shift notes. Client opt-in via Idempotency-Key header.
async function postHandler(req: NextRequest) {
  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "time:write");
    if (denied) return denied;
    const supabase = await createClient();

    // Cross-tenant FK guard — the referenced time entry must belong to the org.
    const { data: entry } = await supabase
      .from("time_entries")
      .select("id")
      .eq("id", input.timeEntryId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!entry) return apiError("not_found", "Time entry not found in your organization");

    const { data, error } = await supabase
      .from("shift_notes")
      .insert({
        org_id: session.orgId,
        time_entry_id: input.timeEntryId,
        author_id: session.userId,
        body: input.body,
        as_manager: input.asManager,
      })
      .select("id, time_entry_id, body, as_manager, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ shiftNote: data });
  });
}

export const POST = withIdempotency(postHandler);
