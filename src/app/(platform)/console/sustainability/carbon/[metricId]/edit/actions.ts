"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  scope: z.coerce.number().int().min(1).max(3),
  kg_co2e: z.coerce.number().min(0),
  source: z.string().max(120).optional(),
  method: z.string().max(120).optional(),
});

export type State = { error?: string } | null;

export async function updateMetric(metricId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("sustainability_metrics")
    .update({
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      scope: parsed.data.scope,
      kg_co2e: parsed.data.kg_co2e,
      source: parsed.data.source || null,
      method: parsed.data.method || null,
    })
    .eq("id", metricId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/sustainability/carbon/${metricId}`);
  revalidatePath("/console/sustainability/carbon");
  redirect(`/console/sustainability/carbon/${metricId}`);
}

export async function deleteMetric(metricId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("sustainability_metrics").delete().eq("id", metricId).eq("org_id", session.orgId);
  revalidatePath("/console/sustainability/carbon");
  redirect("/console/sustainability/carbon");
}
