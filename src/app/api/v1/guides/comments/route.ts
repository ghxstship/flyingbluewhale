import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { withIdempotency } from "@/lib/idempotency";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  guideId: z.string().uuid(),
  orgId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().max(80).nullish(),
  authorEmail: z.string().email().max(120).nullish(),
  parentId: z.string().uuid().nullish(),
  sectionKey: z.string().max(80).nullish(),
});

async function postHandler(req: NextRequest) {
  // Public write surface (anonymous guide visitors can comment) — IP
  // rate-limit it like every other unauthenticated POST, or one script
  // floods an org's guide threads with spoofed author names.
  const rl = await ratelimit({ key: keyFromRequest(req, "guide-comments"), ...RATE_BUDGETS.write });
  if (!rl.ok) return apiError("rate_limited", "Too many comments. Slow down.");

  const parsed = await parseJson(req, Schema);
  if (parsed instanceof NextResponse) return parsed;

  const { guideId, orgId, body, authorName, authorEmail, parentId, sectionKey } = parsed;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const authorUserId = userData.user?.id ?? null;

  // Cross-tenant FK guard: the (orgId, guideId) pair must reference
  // the same row. Without this, any visitor could submit guideId from
  // org A together with orgId of org B and pollute B's comment thread
  // / audit attribution. event_guides has SELECT-RLS; for public guides
  // we verify via service-role (out of scope here) — for the auth'd
  // path we just confirm the row exists with the expected org_id.
  const { data: guide } = await supabase
    .from("event_guides")
    .select("id, org_id")
    .eq("id", guideId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!guide) return apiError("not_found", "Guide not found");

  const { data, error } = await supabase
    .from("guide_comments")
    .insert({
      org_id: orgId,
      guide_id: guideId,
      body,
      author_user_id: authorUserId,
      author_name: authorName ?? null,
      author_email: authorEmail ?? null,
      parent_id: parentId ?? null,
      section_key: sectionKey ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return apiError("forbidden", error?.message ?? "Couldn't post comment");
  }

  return apiCreated({ comment: data });
}

export const POST = withIdempotency(postHandler);

export async function GET(req: NextRequest) {
  const guideId = req.nextUrl.searchParams.get("guideId");
  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!guideId) return apiError("bad_request", "guideId required");
  // Require the matching (orgId, guideId) pair like the POST handler does.
  // guideId alone let an anonymous caller enumerate UUIDs and harvest
  // every published guide's comment threads platform-wide.
  if (!orgId) return apiError("bad_request", "orgId required");

  // Same IP budget as the POST — unauthenticated enumeration of 100-row
  // pages is otherwise free.
  const rl = await ratelimit({ key: keyFromRequest(req, "guide-comments-read"), ...RATE_BUDGETS.default });
  if (!rl.ok) return apiError("rate_limited", "Too many requests. Slow down.");

  const supabase = await createClient();
  const { data: guide } = await supabase
    .from("event_guides")
    .select("id")
    .eq("id", guideId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!guide) return apiError("not_found", "Guide not found");

  const { data, error } = await supabase
    .from("guide_comments")
    .select("id, body, author_name, created_at, resolved_at, parent_id, section_key")
    .eq("guide_id", guideId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return apiError("forbidden", error.message);
  return apiOk({ comments: data ?? [] });
}
