import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
  duration_minutes: z.number().int().min(1).max(600).optional(),
  required_for_role: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "courses:create"), ...RATE_BUDGETS.write });
  if (!rl.ok) return apiError("rate_limited", "Too many requests");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!isManagerPlus(session)) return apiError("forbidden", "Manager+ required to create courses");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        org_id: session.orgId,
        title: input.title,
        summary: input.summary ?? null,
        duration_minutes: input.duration_minutes ?? null,
        required_for_role: input.required_for_role ?? null,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error) return apiError("internal", error.message);
    return apiCreated({ id: data.id });
  });
}
