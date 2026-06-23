"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_PHASES } from "@/lib/finance/xpms-budget";
import { formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/studio/finance/money";

const Schema = z.object({
  description: z.string().min(1).max(500),
  // Integer cents from MoneyInput's hidden field — never a dollar string.
  amount_cents: moneyCentsString({ allowEmpty: true }),
  currency: z.string().min(1).max(3),
  category: z.string().max(120).optional().or(z.literal("")),
  expense_state: z.string(),
  spent_at: z.string().min(1),
  // XPMS taxonomy parity with the create action
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

export async function updateExpense(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("expenses", session.orgId, id, expectedUpdatedAt, {
    description: parsed.data.description,
    amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
    currency: parsed.data.currency,
    category: parsed.data.category || null,
    expense_state: parsed.data.expense_state as "pending" | "approved" | "rejected" | "reimbursed",
    spent_at: parsed.data.spent_at,
    department: parsed.data.department || null,
    discipline: parsed.data.discipline || null,
    xpms_phase: parsed.data.xpms_phase || null,
    item: parsed.data.item || null,
    vendor: parsed.data.vendor || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Expense not found." };
  }
  revalidatePath(`/studio/finance/expenses/${id}`);
  revalidatePath("/studio/finance/expenses");
  redirect(`/studio/finance/expenses/${id}`);
}

export async function deleteExpense(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete expense: ${error.message}`);
  revalidatePath("/studio/finance/expenses");
  redirect("/studio/finance/expenses");
}
