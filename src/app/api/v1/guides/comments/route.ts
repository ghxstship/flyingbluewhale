import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  guideId: z.string().uuid(),
  orgId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().max(80).nullish(),
  authorEmail: z.string().email().max(120).nullish(),
  parentId: z.string().uuid().nullish(),
  sectionKey: z.string().max(80).nullish(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Schema);
  if (parsed instanceof NextResponse) return parsed;

  const { guideId, orgId, body, authorName, authorEmail, parentId, sectionKey } = parsed;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const authorUserId = userData.user?.id ?? null;

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

export async function GET(req: NextRequest) {
  const guideId = req.nextUrl.searchParams.get("guideId");
  if (!guideId) return apiError("bad_request", "guideId required");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_comments")
    .select("id, body, author_name, created_at, resolved_at, parent_id, section_key")
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return apiError("forbidden", error.message);
  return NextResponse.json({ ok: true, comments: data ?? [] });
}
