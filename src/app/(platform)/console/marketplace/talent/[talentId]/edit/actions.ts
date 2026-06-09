"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  talent_id: z.string().uuid(),
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

export async function updateTalentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit talent profiles" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_profiles")
    .update({
      act_name: parsed.data.act_name,
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
    })
    .eq("id", parsed.data.talent_id)
    .eq("org_id", session.orgId);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/marketplace/talent/${parsed.data.talent_id}`);
  redirect(`/console/marketplace/talent/${parsed.data.talent_id}`);
}
