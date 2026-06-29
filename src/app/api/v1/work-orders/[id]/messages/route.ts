import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET  /api/v1/work-orders/{id}/messages — the work order's thread (oldest first).
 * POST /api/v1/work-orders/{id}/messages — post a message (author = caller).
 * Subcontractor-operations layer (v7.5), Phase 2.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("work_order_messages")
      .select("id, body, author_id, created_at")
      .eq("org_id", session.orgId)
      .eq("work_order_id", id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return apiError("internal", error.message);
    return apiOk({ messages: data ?? [] });
  });
}

const PostSchema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (session) => {
    const input = await parseJson(req, PostSchema);
    if (input instanceof Response) return input;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("work_order_messages")
      .insert({ org_id: session.orgId, work_order_id: id, author_id: session.userId, body: input.body })
      .select("id, body, author_id, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ message: data });
  });
}
