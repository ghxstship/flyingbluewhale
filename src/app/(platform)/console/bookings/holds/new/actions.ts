"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  tier: z.string().regex(/^[1-5]$/),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  label: z.string().max(200).optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  talent_profile_id: z.string().uuid().optional().or(z.literal("")),
  auto_release_on: z.string().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

export async function createTieredHoldAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("availability_slots").insert({
    user_id: session.userId,
    org_id: session.orgId,
    kind: "hold",
    tier: Number(parsed.data.tier),
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    label: parsed.data.label || null,
    venue_id: parsed.data.venue_id || null,
    talent_profile_id: parsed.data.talent_profile_id || null,
    auto_release_on: parsed.data.auto_release_on || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/bookings/holds");
  redirect("/console/bookings/holds");
}

export async function releaseHoldAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("hold_id") ?? "");
  if (!id) return { error: "Missing hold" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("availability_slots").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/bookings/holds");
  return { ok: true };
}
