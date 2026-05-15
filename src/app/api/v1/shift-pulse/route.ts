import { z } from "zod";
import { apiError, apiCreated, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
  shift_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("shift_pulses").upsert(
    {
      org_id: session.orgId,
      user_id: session.userId,
      shift_id: input.shift_id ?? null,
      shift_date: today,
      rating: input.rating,
      comment: input.comment ?? null,
    },
    { onConflict: "org_id,user_id,shift_date" },
  );

  if (error) {
    if (error.code === "23505") return apiError("conflict", "You already rated today's shift");
    return apiError("internal", error.message);
  }

  return apiCreated({ submitted: true });
}
