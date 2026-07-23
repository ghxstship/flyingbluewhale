"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  tier: z.string().regex(/^[1-5]$/),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  label: z.string().max(200).optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  talent_profile_id: z.string().uuid().optional().or(z.literal("")),
  auto_release_on: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTieredHoldAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Tiered holds block calendar availability for venues + talent —
  // manager+ at the app layer.
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-tiered-holds", "Only manager+ can create tiered holds") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on the optional venue_id + talent_profile_id.
  const venueId = parsed.data.venue_id || null;
  const talentId = parsed.data.talent_profile_id || null;
  if (venueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!venue) return { error: actionErrorMessage("not-found.venue-in-org", "Venue not found in your organization") };
  }
  if (talentId) {
    const { data: talent } = await supabase
      .from("talent_profiles")
      .select("id")
      .eq("id", talentId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!talent) return { error: actionErrorMessage("not-found.talent-profile-in-org", "Talent profile not found in your organization") };
  }

  const { error } = await supabase.from("availability_slots").insert({
    user_id: session.userId,
    org_id: session.orgId,
    kind: "hold",
    tier: Number(parsed.data.tier),
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    label: parsed.data.label || null,
    venue_id: venueId,
    talent_profile_id: talentId,
    auto_release_on: parsed.data.auto_release_on || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/bookings/holds");
  redirect("/studio/bookings/holds");
}

export async function releaseHoldAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.release-tiered-holds", "Only manager+ can release tiered holds") };
  const id = String(fd.get("hold_id") ?? "");
  if (!id) return { error: actionErrorMessage("missing.hold", "Missing hold") };
  const supabase = await createClient();
  const { error } = await supabase.from("availability_slots").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/studio/bookings/holds");
  return { ok: true };
}
