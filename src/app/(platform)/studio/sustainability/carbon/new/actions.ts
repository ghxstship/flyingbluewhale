"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  scope: z.coerce.number().int().min(1).max(3).default(1),
  kg_co2e: z.coerce.number().min(0).default(0),
  source: z.string().max(120).optional(),
  method: z.string().max(120).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createMetric(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sustainability_metrics")
    .insert({
      org_id: session.orgId,
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      scope: parsed.data.scope,
      kg_co2e: parsed.data.kg_co2e,
      source: parsed.data.source || null,
      method: parsed.data.method || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/sustainability/carbon");
  redirect(`/studio/sustainability/carbon/${data.id}`);
}
