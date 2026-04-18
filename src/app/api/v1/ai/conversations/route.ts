import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, model, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return apiError("internal", error.message);
  return NextResponse.json({ ok: true, data: { conversations: data ?? [] } });
}
