"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { TALENT_RIDER_KINDS, slugify } from "@/lib/marketplace";

const Schema = z.object({
  act_name: z.string().min(1).max(200),
  tagline: z.string().max(200).optional().or(z.literal("")),
  bio: z.string().max(8000).optional().or(z.literal("")),
  genre_tags: z.string().max(400).optional().or(z.literal("")),
  fee_min: z.string().optional().or(z.literal("")),
  fee_max: z.string().optional().or(z.literal("")),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  travel_radius_km: z.string().optional().or(z.literal("")),
  deposit_pct: z.string().optional().or(z.literal("")),
  agent_email: z.string().email().optional().or(z.literal("")),
  agent_name: z.string().max(120).optional().or(z.literal("")),
  video_reel_url: z.string().url().optional().or(z.literal("")),
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

export async function createTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const baseHandle = slugify(parsed.data.act_name);
  const handleSuffix = Math.random().toString(36).slice(2, 6);
  const publicHandle = `${baseHandle}-${handleSuffix}`;

  const { data, error } = await supabase
    .from("talent_profiles")
    .insert({
      org_id: session.orgId,
      act_name: parsed.data.act_name,
      public_handle: publicHandle,
      tagline: parsed.data.tagline || null,
      bio: parsed.data.bio || null,
      genre_tags: toArray(parsed.data.genre_tags),
      fee_min_cents: toCents(parsed.data.fee_min),
      fee_max_cents: toCents(parsed.data.fee_max),
      currency: parsed.data.currency,
      travel_radius_km: parsed.data.travel_radius_km ? Math.round(Number(parsed.data.travel_radius_km)) : null,
      deposit_pct: parsed.data.deposit_pct
        ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.deposit_pct))))
        : 60,
      agent_email: parsed.data.agent_email || null,
      agent_name: parsed.data.agent_name || null,
      video_reel_url: parsed.data.video_reel_url || null,
      is_public: false,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/talent");
  redirect(`/console/marketplace/talent/${(data as { id: string }).id}`);
}

export async function publishTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("talent_id") ?? "");
  if (!id) return { error: "Missing talent" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("talent_profiles")
    .update({ is_public: true })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/talent");
  revalidatePath(`/console/marketplace/talent/${id}`);
  return { error: undefined };
}

export async function unpublishTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("talent_id") ?? "");
  if (!id) return { error: "Missing talent" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("talent_profiles")
    .update({ is_public: false })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/talent");
  revalidatePath(`/console/marketplace/talent/${id}`);
  return { error: undefined };
}

const RiderSchema = z.object({
  talent_id: z.string().uuid(),
  kind: z.enum(TALENT_RIDER_KINDS),
  title: z.string().max(200).optional().or(z.literal("")),
  content: z.string().max(20000).optional().or(z.literal("")),
  file_url: z.string().url().optional().or(z.literal("")),
});

export async function createRiderAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RiderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Demote the previous current rider of this kind.
  await supabase
    .from("talent_riders")
    .update({ is_current: false })
    .eq("talent_profile_id", parsed.data.talent_id)
    .eq("kind", parsed.data.kind)
    .eq("is_current", true);

  const { error: insertError } = await supabase.from("talent_riders").insert({
    org_id: session.orgId,
    talent_profile_id: parsed.data.talent_id,
    kind: parsed.data.kind,
    title: parsed.data.title || null,
    content: parsed.data.content ? { body: parsed.data.content } : {},
    file_url: parsed.data.file_url || null,
    is_current: true,
    created_by: session.userId,
  });
  if (insertError) return { error: insertError.message };
  revalidatePath(`/console/marketplace/talent/${parsed.data.talent_id}/riders`);
  redirect(`/console/marketplace/talent/${parsed.data.talent_id}/riders`);
}
