"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_PHASES } from "@/lib/finance/xpms-budget";
import { actionFail, formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/studio/finance/money";

const Schema = z.object({
  description: z.string().min(1).max(500),
  // Sea Trial R3 FINDING-019: validator rejects non-numeric, negative,
  // and zero amounts at the schema level. Integer cents from
  // MoneyInput's hidden field — do NOT run this through dollarsToCents
  // (100× trap).
  amount_cents: moneyCentsString({ allowZero: false }),
  category: z.string().max(80).optional().or(z.literal("")),
  spent_at: z.string().date(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  atom_id: z.string().uuid().optional().or(z.literal("")),
  // XPMS taxonomy (migration 0071). Optional; line_type for expenses
  // is implicit (always Scope — Fee/Contingency live on budgets only).
  department: z.enum(XPMS_DEPARTMENTS).optional().or(z.literal("")),
  discipline: z.enum(XPMS_DISCIPLINES).optional().or(z.literal("")),
  xpms_phase: z.enum(XPMS_PHASES).optional().or(z.literal("")),
  item: z.string().max(120).optional().or(z.literal("")),
  vendor: z.string().max(160).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createExpenseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on project_id.
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  // Cross-tenant guard on atom pin.
  const atomId = parsed.data.atom_id || null;
  if (atomId) {
    const { data: atom } = await supabase
      .from("xpms_atoms")
      .select("id, project_id")
      .eq("id", atomId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!atom) return { error: "Atom not found in your organization" };
    if (parsed.data.project_id && atom.project_id && atom.project_id !== parsed.data.project_id) {
      return { error: "Atom belongs to a different project" };
    }
  }

  const { error } = await supabase.from("expenses").insert({
    org_id: session.orgId,
    submitter_id: session.userId,
    description: parsed.data.description,
    amount_cents: Number(parsed.data.amount_cents),
    category: parsed.data.category || null,
    spent_at: parsed.data.spent_at,
    project_id: parsed.data.project_id || null,
    atom_id: atomId,
    department: parsed.data.department || null,
    discipline: parsed.data.discipline || null,
    xpms_phase: parsed.data.xpms_phase || null,
    item: parsed.data.item || null,
    vendor: parsed.data.vendor || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/finance/expenses");
  redirect("/studio/finance/expenses");
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk approve / reject pending expenses from the list table (audit
 * A-22). manager+ only; rows not in `pending` are skipped and reported.
 */
async function bulkSetExpenseState(ids: string[], next: "approved" | "rejected"): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Review Expenses" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("expenses")
    .update({ expense_state: next })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .eq("expense_state", "pending")
    .select("id");
  if (error) return { error: `Could Not Update · ${error.message}` };
  const done = updated?.length ?? 0;
  const skipped = parsed.data.length - done;
  revalidatePath("/studio/finance/expenses");
  revalidatePath("/studio/finance");
  const verb = next === "approved" ? "Approved" : "Rejected";
  if (skipped > 0) return { error: `${done} ${verb} · ${skipped} Skipped (not pending)` };
  return { message: `${done} ${done === 1 ? "Expense" : "Expenses"} ${verb}` };
}

export async function bulkApproveExpenses(ids: string[]): Promise<BulkResult> {
  return bulkSetExpenseState(ids, "approved");
}

export async function bulkRejectExpenses(ids: string[]): Promise<BulkResult> {
  return bulkSetExpenseState(ids, "rejected");
}
