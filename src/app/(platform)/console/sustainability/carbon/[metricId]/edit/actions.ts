"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  scope: z.coerce.number().int().min(1).max(3),
  kg_co2e: z.coerce.number().min(0),
  source: z.string().max(120).optional(),
  method: z.string().max(120).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateMetric(metricId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("sustainability_metrics", session.orgId, metricId, expectedUpdatedAt, {
    period_start: parsed.data.period_start,
    period_end: parsed.data.period_end,
    scope: parsed.data.scope,
    kg_co2e: parsed.data.kg_co2e,
    source: parsed.data.source || null,
    method: parsed.data.method || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Sustainability Metric not found." };
  }
  revalidatePath(`/console/sustainability/carbon/${metricId}`);
  revalidatePath("/console/sustainability/carbon");
  redirect(`/console/sustainability/carbon/${metricId}`);
}

export async function deleteMetric(metricId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sustainability_metrics")
    .delete()
    .eq("id", metricId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete sustainability metric: ${error.message}`);
  revalidatePath("/console/sustainability/carbon");
  redirect("/console/sustainability/carbon");
}
