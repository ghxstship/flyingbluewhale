"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { revalidatePath } from "next/cache";

export type OpenShiftState = { error?: string; success?: boolean } | null;

export async function createOpenShift(
  _prev: OpenShiftState,
  formData: FormData,
): Promise<OpenShiftState> {
  const session = await requireSession();
  const supabase = await createClient();

  const role = (formData.get("role") as string | null)?.trim();
  const starts_at = formData.get("starts_at") as string | null;
  const ends_at = formData.get("ends_at") as string | null;

  if (!role || !starts_at || !ends_at) {
    return { error: "Role, start time, and end time are required." };
  }
  if (new Date(ends_at) <= new Date(starts_at)) {
    return { error: "End time must be after start time." };
  }

  const project_id = (formData.get("project_id") as string | null) || null;
  const hourly_rate_raw = formData.get("hourly_rate") as string | null;
  const hourly_rate_cents = hourly_rate_raw ? Math.round(parseFloat(hourly_rate_raw) * 100) : null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const max_claims = parseInt((formData.get("max_claims") as string | null) ?? "1", 10) || 1;
  const notify_crew = formData.get("notify_crew") === "on";

  const { data: shift, error } = await supabase
    .from("open_shifts")
    .insert({
      org_id: session.orgId,
      project_id,
      role,
      starts_at,
      ends_at,
      hourly_rate_cents,
      description,
      max_claims,
      notify_crew,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error || !shift) {
    return { error: error?.message ?? "Failed to create open shift." };
  }

  if (notify_crew) {
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", session.orgId)
      .neq("user_id", session.userId);

    const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    if (userIds.length > 0) {
      await sendPushBulk(userIds, {
        title: "Open Shift Posted",
        body: `New ${role} shift available — tap to claim.`,
        url: "/m/open-shifts",
        kind: "open_shift",
      });
    }
  }

  revalidatePath("/console/workforce/open-shifts");
  return { success: true };
}

export async function updateShiftState(
  shiftId: string,
  state: "cancelled" | "open",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("open_shifts")
    .update({ shift_state: state })
    .eq("id", shiftId)
    .eq("org_id", session.orgId);
  revalidatePath("/console/workforce/open-shifts");
}

export async function decideClaimAction(
  claimId: string,
  decision: "approved" | "declined",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("open_shift_claims")
    .update({ claim_state: decision })
    .eq("id", claimId)
    .eq("org_id", session.orgId);
  revalidatePath("/console/workforce/open-shifts");
}
