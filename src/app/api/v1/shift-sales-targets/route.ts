import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  schedule_name: z.string().max(120).nullable().optional(),
  projected_revenue_cents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Only managers and above can set sales targets");
  }

  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data, error } = await supabase
    .from("shift_sales_targets")
    .upsert(
      {
        org_id: session.orgId,
        shift_date: input.shift_date,
        schedule_name: input.schedule_name ?? null,
        projected_revenue_cents: input.projected_revenue_cents,
        currency: input.currency,
        notes: input.notes ?? null,
        created_by: session.userId,
      },
      { onConflict: "org_id,shift_date,schedule_name" },
    )
    .select("id")
    .single();

  if (error) return apiError("internal", error.message);
  return apiCreated({ id: (data as { id: string }).id });
}
