"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNTING_PERIOD_STATES,
  transitionAccountingPeriod,
  type AccountingPeriodState,
} from "@/lib/accounting-periods";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const CreateSchema = z.object({
  period_label: z.string().min(1).max(64),
  starts_on: z.string().date(),
  ends_on: z.string().date(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAccountingPeriodAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Accounting periods are critical financial controls — opening one
  // is org-policy, closing one locks journal entries. Owner/admin only.
  if (!isAdmin(session)) return { error: actionErrorMessage("auth.owner-admin.manage-accounting-periods", "Only owners and admins can manage accounting periods") };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  if (parsed.data.ends_on < parsed.data.starts_on) {
    return { error: actionErrorMessage("ends-on-must-be-on-or-after-starts-on", "ends_on must be on or after starts_on") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_periods")
    .insert({
      org_id: session.orgId,
      period_label: parsed.data.period_label,
      starts_on: parsed.data.starts_on,
      ends_on: parsed.data.ends_on,
      state: "OPEN",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  const { error: transitionErr } = await supabase.from("accounting_period_state_transitions").insert({
    org_id: session.orgId,
    accounting_period_id: data.id,
    from_state: null,
    to_state: "OPEN",
    reason: "Period opened",
    transitioned_by: session.userId,
  });
  if (transitionErr) return { error: transitionErr.message };

  revalidatePath("/studio/finance/periods");
  redirect(`/studio/finance/periods/${data.id}`);
}

export async function transitionAccountingPeriodAction(id: string, to: AccountingPeriodState, reason?: string) {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: actionErrorMessage("auth.owner-admin.transition-accounting-periods", "Only owners and admins can transition accounting periods") };
  if (!ACCOUNTING_PERIOD_STATES.includes(to)) return { error: actionErrorMessage("invalid.target-state", "Invalid target state") };
  const result = await transitionAccountingPeriod({
    orgId: session.orgId,
    periodId: id,
    to,
    reason,
    transitionedBy: session.userId,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/studio/finance/periods/${id}`);
  revalidatePath("/studio/finance/periods");
  return { ok: true as const };
}
