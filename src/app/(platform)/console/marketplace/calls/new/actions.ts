"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MARKETPLACE_KINDS, slugify } from "@/lib/marketplace";

const Schema = z.object({
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

export type State = { error?: string } | null;

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

export async function createCallAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can post open calls" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.title);
  const slugSuffix = Math.random().toString(36).slice(2, 7);
  const publicSlug = `${baseSlug}-${slugSuffix}`;

  const slotMin = parsed.data.slot_length_min ? Math.max(1, Math.round(Number(parsed.data.slot_length_min))) : null;

  const { data, error } = await supabase
    .from("open_calls")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      public_slug: publicSlug,
      description: parsed.data.description || null,
      genre_tags: toArray(parsed.data.genre_tags),
      trade_categories: toArray(parsed.data.trade_categories),
      region: parsed.data.region || null,
      venue_type: parsed.data.venue_type || null,
      performance_date: parsed.data.performance_date || null,
      slot_length_min: slotMin,
      fee_min_cents: toCents(parsed.data.fee_min),
      fee_max_cents: toCents(parsed.data.fee_max),
      currency: parsed.data.currency,
      deadline_at: parsed.data.deadline_at || null,
      status: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/calls");
  redirect(`/console/marketplace/calls/${(data as { id: string }).id}`);
}

// Open-call FSM: draft → published → closed. publish/close are guarded
// against invalid source states so a stale UI or direct API call can't
// jump the rails. .select("id") confirms the conditional update landed
// — without it, an out-of-state transition silently succeeds with no
// rows affected and the caller thinks the call moved.

export async function publishCallAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("call_id") ?? "");
  if (!id) return { error: "Missing call" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_calls")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("status", "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a draft call can be published" };
  revalidatePath("/console/marketplace/calls");
  revalidatePath(`/console/marketplace/calls/${id}`);
  return { error: undefined };
}

export async function closeCallAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("call_id") ?? "");
  if (!id) return { error: "Missing call" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_calls")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("status", "published")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a published call can be closed" };
  revalidatePath("/console/marketplace/calls");
  revalidatePath(`/console/marketplace/calls/${id}`);
  return { error: undefined };
}
