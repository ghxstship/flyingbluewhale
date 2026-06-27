"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  account_code: z.string().min(1).max(64),
  account_name: z.string().min(1).max(200),
  account_type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  normal_balance: z.enum(["debit", "credit"]),
  parent_account_id: z.string().uuid().optional().or(z.literal("")),
  is_postable: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAccount(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit the chart of accounts" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { error } = await supabase.from("chart_of_accounts").insert({
    org_id: session.orgId,
    account_code: parsed.data.account_code,
    account_name: parsed.data.account_name,
    account_type: parsed.data.account_type,
    normal_balance: parsed.data.normal_balance,
    is_postable: parsed.data.is_postable === "on",
    parent_account_id: parsed.data.parent_account_id || null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/finance/accounts");
  redirect(`/studio/finance/accounts`);
}
