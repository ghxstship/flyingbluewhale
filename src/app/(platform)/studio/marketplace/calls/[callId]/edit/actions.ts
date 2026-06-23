"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MARKETPLACE_KINDS } from "@/lib/marketplace";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  call_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  kind: z.enum(MARKETPLACE_KINDS).default("talent_call"),
  description: z.string().max(8000).optional().or(z.literal("")),
  genre_tags: z.string().max(400).optional().or(z.literal("")),
  trade_categories: z.string().max(400).optional().or(z.literal("")),
  region: z.string().max(80).optional().or(z.literal("")),
  venue_type: z.string().max(80).optional().or(z.literal("")),
  performance_date: z.string().optional().or(z.literal("")),
  slot_length_min: z.string().optional().or(z.literal("")),
  fee_min: z.string().optional().or(z.literal("")),
  fee_max: z.string().optional().or(z.literal("")),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  deadline_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const toCents = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

const toArray = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function updateCallAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit open calls" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("open_calls")
    .update({
      title: parsed.data.title,
      kind: parsed.data.kind,
      description: parsed.data.description || null,
      genre_tags: toArray(parsed.data.genre_tags),
      trade_categories: toArray(parsed.data.trade_categories),
      region: parsed.data.region || null,
      venue_type: parsed.data.venue_type || null,
      performance_date: parsed.data.performance_date || null,
      slot_length_min: parsed.data.slot_length_min ? Math.round(Number(parsed.data.slot_length_min)) : null,
      fee_min_cents: toCents(parsed.data.fee_min),
      fee_max_cents: toCents(parsed.data.fee_max),
      currency: parsed.data.currency,
      deadline_at: parsed.data.deadline_at || null,
    })
    .eq("id", parsed.data.call_id)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/marketplace/calls/${parsed.data.call_id}`);
  redirect(`/studio/marketplace/calls/${parsed.data.call_id}`);
}
