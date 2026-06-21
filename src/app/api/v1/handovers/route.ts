import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { withIdempotency } from "@/lib/idempotency";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/handovers — shift relief / post handover log, off the daily-logs notes hack. */

const POST_STATES = ["all_clear", "watch_items", "issues"] as const;

const CreateSchema = z.object({
  projectId: z.string().uuid().optional(),
  reliefLabel: z.string().max(200).optional(),
  postState: z.enum(POST_STATES).default("all_clear"),
  summary: z.string().min(1).max(8000),
  openItems: z.string().max(8000).optional(),
  assetsPassed: z.string().max(8000).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const pageSizeParam = url.searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : undefined;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "handovers:read");
    if (denied) return denied;
    const page = await listOrgScopedPage("handovers", session.orgId, {
      cursor,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
      orderBy: "created_at",
      ascending: false,
    });
    return apiOk(
      {
        orgId: session.orgId,
        handovers: page.rows,
        nextCursor: page.nextCursor,
        pageSize: page.pageSize,
        totalCount: page.totalCount,
      },
      { headers: { "x-total-count": String(page.totalCount) } },
    );
  });
}

// Wrapped with `withIdempotency` so client retries don't create duplicate
// handover posts. Client opt-in via Idempotency-Key header.
async function postHandler(req: NextRequest) {
  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "handovers:write");
    if (denied) return denied;
    const supabase = await createClient();

    // Cross-tenant FK guard on projectId.
    if (input.projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", input.projectId)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!project) return apiError("not_found", "Project not found in your organization");
    }

    const { data, error } = await supabase
      .from("handovers")
      .insert({
        org_id: session.orgId,
        project_id: input.projectId ?? null,
        from_user_id: session.userId,
        relief_label: input.reliefLabel ?? null,
        post_state: input.postState,
        summary: input.summary,
        open_items: input.openItems ?? null,
        assets_passed: input.assetsPassed ?? null,
      })
      .select("id, project_id, post_state, summary, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ handover: data });
  });
}

export const POST = withIdempotency(postHandler);
