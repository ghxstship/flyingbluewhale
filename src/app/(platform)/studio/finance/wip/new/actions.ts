"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail, actionFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

// WIP-snapshot money fields are stored as numeric DOLLARS (the list page
// renders them via fmt.money(Math.round(n * 100)) — i.e. they are NOT
// integer cents like invoices.amount_cents). So these are plain numeric
// dollar inputs; do NOT route them through MoneyInput / moneyCentsString.
const money = z.coerce.number().min(0).max(1_000_000_000);

const Schema = z.object({
  project_id: z.string().uuid(),
  snapshot_date: z.string().date(),
  contract_amount: money,
  approved_change_orders: money,
  costs_to_date: money,
  estimated_cost_to_complete: money,
  percent_complete: z.coerce.number().min(0).max(100),
  billed_to_date: money,
  bonded: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  surety_carrier: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createWipSnapshot(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // WIP snapshots feed surety / bonding review — manager+ gate matches the
  // rest of Finance authoring.
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-wip-snapshots", "Only manager+ can create WIP snapshots") };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;

  const supabase = await createClient();

  // Cross-tenant FK guard — a dangling project_id corrupts surety reporting.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", d.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };

  // Derived totals — kept consistent with the list-page display semantics
  // (revised contract = contract + COs; EAC = costs + ETC; earned = revised ×
  // %complete; over/under = billed − earned).
  const revised_contract_amount = d.contract_amount + d.approved_change_orders;
  const estimated_at_completion = d.costs_to_date + d.estimated_cost_to_complete;
  const earned_revenue = revised_contract_amount * (d.percent_complete / 100);
  const over_under_billed = d.billed_to_date - earned_revenue;

  const { error } = await supabase.from("wip_snapshots").insert({
    org_id: session.orgId,
    project_id: d.project_id,
    snapshot_date: d.snapshot_date,
    contract_amount: d.contract_amount,
    approved_change_orders: d.approved_change_orders,
    revised_contract_amount,
    costs_to_date: d.costs_to_date,
    estimated_cost_to_complete: d.estimated_cost_to_complete,
    estimated_at_completion,
    percent_complete: d.percent_complete,
    earned_revenue,
    billed_to_date: d.billed_to_date,
    over_under_billed,
    bonded: d.bonded,
    surety_carrier: d.surety_carrier || null,
    notes: d.notes || null,
    generated_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/finance/wip");
  revalidatePath("/studio/finance");
  redirect("/studio/finance/wip");
}
