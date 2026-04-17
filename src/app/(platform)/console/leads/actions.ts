"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  source: z.string().max(80).optional().or(z.literal("")),
  stage: z.enum(["new", "qualified", "contacted", "proposal", "won", "lost"]).default("new"),
  estimated_value: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createLeadAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      stage: parsed.data.stage,
      estimated_value_cents: parsed.data.estimated_value ? dollarsToCents(parsed.data.estimated_value) : null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/leads");
  revalidatePath("/console/pipeline");
  redirect(`/console/leads/${data.id}`);
}

export async function moveLeadStageAction(leadId: string, stage: z.infer<typeof Schema>["stage"]) {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ stage })
    .eq("org_id", session.orgId)
    .eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/console/leads");
  revalidatePath("/console/pipeline");
  return { ok: true as const };
}
