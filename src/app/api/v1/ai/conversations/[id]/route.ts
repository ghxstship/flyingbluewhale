import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const IdSchema = z.string().uuid();

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return apiError("bad_request", "Invalid conversation id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const supabase = await createClient();
  const [{ data: convo }, { data: messages }] = await Promise.all([
    supabase.from("ai_conversations").select("id, title").eq("id", parsed.data).single(),
    supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", parsed.data)
      .order("created_at", { ascending: true }),
  ]);

  if (!convo) return apiError("not_found", "Conversation not found");
  return apiOk({ conversation: convo, messages: messages ?? [] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return apiError("bad_request", "Invalid conversation id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  // Belt-and-suspenders authz on top of RLS: pin user_id explicitly
  // and .select() to surface 404 on a wrong/foreign id instead of a
  // misleading deleted:true. RLS already restricts delete to the
  // owner, but routing the failure through "forbidden" without a
  // rows check made wrong-id silently report success.
  const { data, error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return apiError("forbidden", error.message);
  if (!data || data.length === 0) return apiError("not_found", "Conversation not found");
  return apiOk({ deleted: true });
}
