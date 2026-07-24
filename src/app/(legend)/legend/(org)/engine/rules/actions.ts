"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { COMPLIANCE_RULE_STATES, COMPLIANCE_SEVERITIES } from "@/lib/xmce_engine";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const Schema = z.object({
  code: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(4000).optional().or(z.literal("")),
  severity: z.enum(COMPLIANCE_SEVERITIES),
  category: z.string().max(80).optional().or(z.literal("")),
  rule_state: z.enum(COMPLIANCE_RULE_STATES),
});

export async function createRuleAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can author compliance rules" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("compliance_rules")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      title: parsed.data.title,
      description: parsed.data.description || null,
      severity: parsed.data.severity,
      category: parsed.data.category || null,
      rule_state: parsed.data.rule_state,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/engine/rules");
  redirect(`/legend/engine/rules/${(data as { id: string }).id}`);
}

export async function updateRuleAction(ruleId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit compliance rules" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("compliance_rules")
    .update({
      code: parsed.data.code,
      title: parsed.data.title,
      description: parsed.data.description || null,
      severity: parsed.data.severity,
      category: parsed.data.category || null,
      rule_state: parsed.data.rule_state,
    })
    .eq("id", ruleId)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/legend/engine/rules/${ruleId}`);
  revalidatePath("/legend/engine/rules");
  redirect(`/legend/engine/rules/${ruleId}`);
}

export type SimpleState = { error?: string } | null;

export async function deleteRuleAction(ruleId: string): Promise<SimpleState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can delete compliance rules" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("compliance_rules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ruleId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/legend/engine/rules");
  redirect("/legend/engine/rules");
}
