"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const num = (v: string) => parseFloat(v);

const Schema = z.object({
  name: z.string().min(1).max(200),
  daily_ot_after_hours: z.string().transform(num).pipe(z.number().min(0).max(24)),
  daily_dt_after_hours: z.string().optional().or(z.literal("")).transform((v) => (v ? num(v) : null)),
  weekly_ot_after_hours: z.string().transform(num).pipe(z.number().min(0).max(168)),
  ot_multiplier: z.string().transform(num).pipe(z.number().min(1).max(10)),
  dt_multiplier: z.string().optional().or(z.literal("")).transform((v) => (v ? num(v) : null)),
  seventh_day_rule: z.string().optional(),
  is_default: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createOvertimeRuleAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can configure overtime rules" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const isDefault = parsed.data.is_default === "on";

  if (isDefault) {
    await supabase
      .from("overtime_rules")
      .update({ is_default: false })
      .eq("org_id", session.orgId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("overtime_rules")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      daily_ot_after_hours: parsed.data.daily_ot_after_hours,
      daily_dt_after_hours: parsed.data.daily_dt_after_hours,
      weekly_ot_after_hours: parsed.data.weekly_ot_after_hours,
      ot_multiplier: parsed.data.ot_multiplier,
      dt_multiplier: parsed.data.dt_multiplier,
      seventh_day_rule: parsed.data.seventh_day_rule === "on",
      is_default: isDefault,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/settings/overtime-rules");
  redirect(`/console/settings/overtime-rules/${data.id}`);
}
