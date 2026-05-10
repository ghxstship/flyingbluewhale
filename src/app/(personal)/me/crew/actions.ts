"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/marketplace";

const Schema = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(200).optional().or(z.literal("")),
  bio: z.string().max(8000).optional().or(z.literal("")),
  roles: z.string().max(400).optional().or(z.literal("")),
  unions: z.string().max(400).optional().or(z.literal("")),
  certifications: z.string().max(400).optional().or(z.literal("")),
  day_rate_min: z.string().optional().or(z.literal("")),
  day_rate_max: z.string().optional().or(z.literal("")),
  travel_radius_km: z.string().optional().or(z.literal("")),
  reel_url: z.string().url().optional().or(z.literal("")),
  is_public_profile: z.string().optional(),
  availability_open: z.string().optional(),
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

export async function upsertMyCrewAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const existingResp = await supabase
    .from("crew_members")
    .select("id, public_handle")
    .eq("user_id", session.userId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingResp.data as { id: string; public_handle: string | null } | null;

  const payload = {
    org_id: session.orgId,
    user_id: session.userId,
    name: parsed.data.name,
    tagline: parsed.data.tagline || null,
    bio: parsed.data.bio || null,
    roles: toArray(parsed.data.roles),
    unions: toArray(parsed.data.unions),
    certifications: toArray(parsed.data.certifications),
    day_rate_min_cents: toCents(parsed.data.day_rate_min),
    day_rate_max_cents: toCents(parsed.data.day_rate_max),
    travel_radius_km: parsed.data.travel_radius_km ? Math.round(Number(parsed.data.travel_radius_km)) : null,
    reel_url: parsed.data.reel_url || null,
    is_public_profile: parsed.data.is_public_profile === "on",
    availability_open: parsed.data.availability_open === "on",
    public_handle: existing?.public_handle ?? `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 6)}`,
  };

  if (existing) {
    const { error } = await supabase
      .from("crew_members")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", session.userId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("crew_members").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/me/crew");
  return { ok: true };
}
