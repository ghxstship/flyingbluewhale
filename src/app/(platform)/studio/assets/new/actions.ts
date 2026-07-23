"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const Schema = z.object({
  display_name: z.string().min(1).max(200),
  asset_kind: z.string().min(1).max(64),
  asset_class: z.enum(["gear", "fleet", "lot"]).default("gear"),
  qty: z.coerce.number().int().min(1).max(1_000_000).default(1),
  disposition: z.enum(["ship_to_site", "return_to_vendor", "hold"]).optional().or(z.literal("")),
  location_id: z.string().uuid().optional().or(z.literal("")),
  ownership: z.enum(["owned", "leased", "rented", "sub_hired"]),
  serial: z.string().max(120).optional().or(z.literal("")),
  asset_tag: z.string().max(120).optional().or(z.literal("")),
  acquisition_cost_usd: z.string().optional().or(z.literal("")),
  daily_rate_usd: z.string().optional().or(z.literal("")),
  acquired_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

function toMinor(usd: string | undefined): number | null {
  if (!usd) return null;
  const n = Math.round(Number(usd) * 100);
  return Number.isFinite(n) ? n : null;
}

export async function createAsset(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-assets", "Only manager+ can create assets") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const acquisitionCost = toMinor(parsed.data.acquisition_cost_usd);
  const dailyRate = toMinor(parsed.data.daily_rate_usd);
  if (parsed.data.acquisition_cost_usd && acquisitionCost == null) return actionFail(actionErrorMessage("bad-acquisition-cost", "Bad acquisition cost"), fd);
  if (parsed.data.daily_rate_usd && dailyRate == null) return actionFail(actionErrorMessage("bad-daily-rate", "Bad daily rate"), fd);

  const supabase = await createClient();
  // state (ual_state) defaults to 'acquired' in the DB; omit and let the
  // default apply ('active' is not a ual_state value).
  const { data, error } = await supabase
    .from("assets")
    .insert({
      org_id: session.orgId,
      display_name: parsed.data.display_name,
      asset_kind: parsed.data.asset_kind,
      asset_class: parsed.data.asset_class,
      qty: parsed.data.qty,
      disposition: parsed.data.disposition || null,
      location_id: parsed.data.location_id || null,
      notes: parsed.data.notes || null,
      ownership: parsed.data.ownership,
      serial: parsed.data.serial || null,
      asset_tag: parsed.data.asset_tag || null,
      acquisition_cost_minor: acquisitionCost,
      acquisition_currency: acquisitionCost != null ? "USD" : null,
      daily_rate_minor: dailyRate,
      daily_rate_currency: dailyRate != null ? "USD" : null,
      ...(parsed.data.acquired_at ? { acquired_at: parsed.data.acquired_at } : {}),
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/assets");
  redirect(`/studio/assets/${data.id}`);
}
