"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getOrgScoped } from "@/lib/db/resource";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  journal_entry_id: z.string().uuid(),
  account_id: z.string().uuid(),
  side: z.enum(["debit", "credit"]),
  amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a positive amount"),
  description: z.string().max(300).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function addJournalLine(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.edit-journal-entries", "Only manager+ can edit journal entries") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  // Confirm the parent entry belongs to this org before touching its lines
  // (journal_entry_lines carries no org_id, so this is the scope gate).
  const entry = await getOrgScoped("journal_entries", session.orgId, parsed.data.journal_entry_id);
  if (!entry) return { error: actionErrorMessage("not-found.journal-entry", "Journal entry not found") };

  // Confirm the account is in this org too.
  const account = await getOrgScoped("chart_of_accounts", session.orgId, parsed.data.account_id);
  if (!account) return { error: actionErrorMessage("not-found.account-in-org", "Account not found in this org") };

  const minor = Math.round(Number(parsed.data.amount_usd) * 100);
  if (!Number.isFinite(minor) || minor <= 0) return { error: actionErrorMessage("bad-amount", "Bad amount") };

  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;

  // Next line number = max(existing) + 1.
  const { data: existing } = await loose
    .from("journal_entry_lines")
    .select("line_number")
    .eq("journal_entry_id", parsed.data.journal_entry_id)
    .order("line_number", { ascending: false })
    .limit(1);
  const nextLine = (((existing ?? []) as { line_number: number }[])[0]?.line_number ?? 0) + 1;

  const isDebit = parsed.data.side === "debit";
  const { error } = await loose.from("journal_entry_lines").insert({
    journal_entry_id: parsed.data.journal_entry_id,
    line_number: nextLine,
    account_id: parsed.data.account_id,
    debit_minor: isDebit ? minor : 0,
    credit_minor: isDebit ? 0 : minor,
    base_debit_minor: isDebit ? minor : 0,
    base_credit_minor: isDebit ? 0 : minor,
    currency: "USD",
    base_currency: "USD",
    description: parsed.data.description || null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/finance/ledger/${parsed.data.journal_entry_id}`);
  return { ok: true };
}
