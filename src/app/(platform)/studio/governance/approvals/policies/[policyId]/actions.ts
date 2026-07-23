"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { ROUTING_KINDS } from "@/lib/approvals/queries";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  policy_id: z.string().uuid(),
  step_number: z.coerce.number().int().min(1).max(99),
  routing_kind: z.enum(ROUTING_KINDS),
  threshold: z.string().optional().or(z.literal("")),
  sla_hours: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function addStep(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.edit-approval-policies", "Only manager+ can edit approval policies") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // approval_steps has no org_id — scope by confirming the parent policy
  // belongs to the caller's org.
  const { data: policy } = await supabase
    .from("approval_policies")
    .select("id")
    .eq("id", parsed.data.policy_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!policy) return { error: actionErrorMessage("not-found.policy", "Policy not found") };

  const threshold = parsed.data.threshold ? Math.round(Number(parsed.data.threshold)) : null;
  const slaHours = parsed.data.sla_hours ? Math.round(Number(parsed.data.sla_hours)) : null;
  if (threshold != null && !Number.isFinite(threshold)) return { error: actionErrorMessage("bad-threshold", "Bad threshold") };
  if (slaHours != null && !Number.isFinite(slaHours)) return { error: actionErrorMessage("bad-sla-hours", "Bad SLA hours") };

  const { error } = await supabase.from("approval_steps").insert({
    policy_id: parsed.data.policy_id,
    step_number: parsed.data.step_number,
    routing_kind: parsed.data.routing_kind,
    decider_resolution: {}, // NOT NULL, no default
    threshold,
    sla_hours: slaHours,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/governance/approvals/policies/${parsed.data.policy_id}`);
  return { ok: true };
}
