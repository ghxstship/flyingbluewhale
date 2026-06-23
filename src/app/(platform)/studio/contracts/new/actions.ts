"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { generateNumber } from "@/lib/format";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { actionFail, formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/studio/finance/money";

const UCT_KINDS = [
  "sponsor_deal",
  "vendor_sow",
  "master_services",
  "talent_booking",
  "employment_equivalent",
  "ip_license",
  "partnership",
  "nda",
  "vendor_prequal",
  "rental_agreement",
  "venue_agreement",
  "other",
] as const;

const UCT_STATES = [
  "draft",
  "in_review",
  "negotiation",
  "awaiting_signatures",
  "active",
  "expiring",
  "expired",
  "terminated",
  "renewed",
  "archived",
] as const;

const Schema = z
  .object({
    title: z.string().min(1).max(200),
    number: z.string().max(80).optional().or(z.literal("")),
    kind: z.enum(UCT_KINDS),
    state: z.enum(UCT_STATES).default("draft"),
    counterparty_name: z.string().max(200).optional().or(z.literal("")),
    counterparty_email: z.string().email().max(200).optional().or(z.literal("")),
    // Integer cents from MoneyInput's hidden field — never a dollar string.
    total_value_minor: moneyCentsString({ allowEmpty: true }),
    total_value_currency: z.string().min(3).max(3).default("USD"),
    start_date: z.string().date().optional().or(z.literal("")),
    end_date: z.string().date().optional().or(z.literal("")),
    notes: z.string().max(4000).optional().or(z.literal("")),
  })
  // end_date must not precede start_date when both supplied.
  .refine(...dateRangeRefine("start_date", "end_date"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createContract(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create contracts" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      org_id: session.orgId,
      number: parsed.data.number || generateNumber("CTR"),
      title: parsed.data.title,
      kind: parsed.data.kind,
      state: parsed.data.state,
      counterparty_name: parsed.data.counterparty_name || null,
      counterparty_email: parsed.data.counterparty_email || null,
      total_value_minor: parsed.data.total_value_minor ? Number(parsed.data.total_value_minor) : null,
      total_value_currency: parsed.data.total_value_currency.toUpperCase(),
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/contracts");
  redirect(`/studio/contracts/${data.id}`);
}
