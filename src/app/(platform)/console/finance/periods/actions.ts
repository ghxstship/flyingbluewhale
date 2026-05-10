"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNTING_PERIOD_STATES,
  transitionAccountingPeriod,
  type AccountingPeriodState,
} from "@/lib/accounting-periods";

const CreateSchema = z.object({
  period_label: z.string().min(1).max(64),
  starts_on: z.string().date(),
  ends_on: z.string().date(),
});

export type State = { error?: string } | null;

export async function createAccountingPeriodAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (parsed.data.ends_on < parsed.data.starts_on) {
    return { error: "ends_on must be on or after starts_on" };
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
  if (error) return { error: error.message };

  await supabase.from("accounting_period_state_transitions").insert({
    org_id: session.orgId,
    accounting_period_id: data.id,
    from_state: null,
    to_state: "OPEN",
    reason: "Period opened",
    transitioned_by: session.userId,
  });

  revalidatePath("/console/finance/periods");
  redirect(`/console/finance/periods/${data.id}`);
}

export async function transitionAccountingPeriodAction(id: string, to: AccountingPeriodState, reason?: string) {
  const session = await requireSession();
  if (!ACCOUNTING_PERIOD_STATES.includes(to)) return { error: "Invalid target state" };
  const result = await transitionAccountingPeriod({
    orgId: session.orgId,
    periodId: id,
    to,
    reason,
    transitionedBy: session.userId,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(`/console/finance/periods/${id}`);
  revalidatePath("/console/finance/periods");
  return { ok: true as const };
}
