"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  entry_number: z.string().min(1).max(64),
  description: z.string().min(1).max(300),
  period_id: z.string().uuid(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createJournalEntry(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.post-journal-entries", "Only manager+ can post journal entries") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      org_id: session.orgId,
      period_id: parsed.data.period_id,
      entry_number: parsed.data.entry_number,
      description: parsed.data.description,
      posted_by: session.userId || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/finance/ledger");
  redirect(`/studio/finance/ledger/${data.id}`);
}
