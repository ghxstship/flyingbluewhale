"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_PHASES } from "@/lib/finance/xpms-budget";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  description: z.string().min(1).max(500),
  // Sea Trial R3 FINDING-019: validator rejects non-numeric, negative,
  // and zero-dollar expenses at the schema level so dollarsToCents
  // never silently coerces to 0.
  amount: moneyDollarsString({ allowZero: false }),
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
    amount_cents: dollarsToCents(parsed.data.amount),
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
  revalidatePath("/console/finance/expenses");
  redirect("/console/finance/expenses");
}
