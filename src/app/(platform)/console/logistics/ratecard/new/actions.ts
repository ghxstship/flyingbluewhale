"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  catalog: z.string().min(1).max(60),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  unit_price: z.string().min(1),
  currency: z.string().length(3).default("USD"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createRateCardItem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rate_card_items")
    .insert({
      org_id: session.orgId,
      catalog: parsed.data.catalog,
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description || null,
      unit_price_cents: dollarsToCents(parsed.data.unit_price),
      currency: parsed.data.currency.toUpperCase(),
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/logistics/ratecard");
  redirect(`/console/logistics/ratecard/${data.id}`);
}
