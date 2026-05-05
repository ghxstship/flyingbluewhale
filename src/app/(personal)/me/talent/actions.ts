"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { slugify } from "@/lib/marketplace";

const Schema = z.object({
  act_name: z.string().min(1).max(200),
  tagline: z.string().max(200).optional().or(z.literal("")),
  bio: z.string().max(8000).optional().or(z.literal("")),
  genre_tags: z.string().max(400).optional().or(z.literal("")),
  fee_min: z.string().optional().or(z.literal("")),
  fee_max: z.string().optional().or(z.literal("")),
  video_reel_url: z.string().url().optional().or(z.literal("")),
  is_public: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

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

export async function upsertMyTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const existingResp = await supabase
    .from("talent_profiles")
    .select("id, public_handle")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();
  const existing = existingResp.data as { id: string; public_handle: string | null } | null;

  const payload = {
    org_id: session.orgId,
    user_id: session.userId,
    act_name: parsed.data.act_name,
    tagline: parsed.data.tagline || null,
    bio: parsed.data.bio || null,
    genre_tags: toArray(parsed.data.genre_tags),
    fee_min_cents: toCents(parsed.data.fee_min),
    fee_max_cents: toCents(parsed.data.fee_max),
    video_reel_url: parsed.data.video_reel_url || null,
    is_public: parsed.data.is_public === "on",
    public_handle:
      existing?.public_handle ?? `${slugify(parsed.data.act_name)}-${Math.random().toString(36).slice(2, 6)}`,
  };

  if (existing) {
    const { error } = await supabase
      .from("talent_profiles")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", session.userId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("talent_profiles").insert({ ...payload, created_by: session.userId });
    if (error) return { error: error.message };
  }

  revalidatePath("/me/talent");
  return { ok: true };
}
