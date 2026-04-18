import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const supabase = await createClient();
  const [{ data: convo }, { data: messages }] = await Promise.all([
    supabase.from("ai_conversations").select("id, title, model").eq("id", id).single(),
    supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!convo) return apiError("not_found", "Conversation not found");
  return NextResponse.json({ ok: true, data: { conversation: convo, messages: messages ?? [] } });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
  if (error) return apiError("forbidden", error.message);
  return NextResponse.json({ ok: true });
}
