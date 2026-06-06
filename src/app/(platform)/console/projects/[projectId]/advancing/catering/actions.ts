"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

export type State = { error?: string } | null;

const IssueSchema = z.object({
  project_id: z.string().uuid(),
  holder_id: z.string().uuid(),
  meal_category: z.enum(["breakfast", "lunch", "dinner", "afternoon_tea", "snack", "all_day"]),
  meal_date: z.string().min(1),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function issueMealTicketAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const parsed = IssueSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("meal_tickets").insert({
    org_id: session.orgId,
    project_id: parsed.data.project_id,
    holder_id: parsed.data.holder_id,
    meal_category: parsed.data.meal_category,
    meal_date: parsed.data.meal_date,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });

  if (error) return { error: error.message };

  await sendPushTo(parsed.data.holder_id, {
    title: "Meal ticket issued",
    body: `Your ${parsed.data.meal_category} ticket for ${parsed.data.meal_date} is ready`,
    url: "/m/meals",
    kind: "meal_ticket",
    scope: "mobile",
    orgId: session.orgId,
  });

  revalidatePath(`/console/projects/${parsed.data.project_id}/advancing/catering`);
  return null;
}

const RedeemSchema = z.object({
  ticket_id: z.string().uuid(),
  project_id: z.string().uuid(),
});

export async function redeemMealTicketAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const parsed = RedeemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_tickets")
    .update({
      is_redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_by: session.userId,
    })
    .eq("id", parsed.data.ticket_id)
    .eq("org_id", session.orgId)
    .eq("is_redeemed", false)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Ticket already redeemed or not found" };

  revalidatePath(`/console/projects/${parsed.data.project_id}/advancing/catering`);
  return null;
}
