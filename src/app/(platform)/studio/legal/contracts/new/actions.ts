"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { CONTRACT_KINDS } from "@/lib/clm/queries";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const Schema = z.object({
  title: z.string().min(1).max(200),
  number: z.string().min(1).max(64),
  kind: z.enum(CONTRACT_KINDS),
  project_id: z.string().uuid("Pick a project"),
  counterparty_name: z.string().max(200).optional().or(z.literal("")),
  counterparty_email: z.string().email("Bad email").max(200).optional().or(z.literal("")),
  total_value_usd: z.string().optional().or(z.literal("")),
  start_at: z.string().optional().or(z.literal("")),
  end_at: z.string().optional().or(z.literal("")),
  auto_renew: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createContract(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-contracts", "Only manager+ can create contracts") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;

  const minor = d.total_value_usd ? Math.round(Number(d.total_value_usd) * 100) : null;
  if (minor != null && !Number.isFinite(minor)) return actionFail(actionErrorMessage("bad-total-value", "Bad total value"), fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      org_id: session.orgId,
      project_id: d.project_id,
      kind: d.kind,
      number: d.number,
      title: d.title,
      // state omitted — DB default 'draft'.
      counterparty_name: d.counterparty_name || null,
      counterparty_email: d.counterparty_email || null,
      total_value_minor: minor,
      total_value_currency: minor != null ? "USD" : null,
      start_at: d.start_at ? new Date(d.start_at).toISOString() : null,
      end_at: d.end_at ? new Date(d.end_at).toISOString() : null,
      auto_renew: d.auto_renew === "on",
      notes: d.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/legal/contracts");
  redirect(`/studio/legal/contracts/${data.id}`);
}
