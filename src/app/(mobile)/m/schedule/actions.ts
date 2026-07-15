"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { UNDECIDED_SWAP_STATES } from "@/lib/workforce";

export type State = { error?: string; ok?: boolean } | null;

const Input = z.object({
  shiftId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Ask to be swapped off a shift.
 *
 * Both shells could DECIDE a swap and neither could FILE one: every
 * `from("shift_swaps")` call site in the repo was a select or an update,
 * so `shift_swaps` rows could only ever originate from seed data or a
 * hand-written INSERT. The console's approve/decline queue was a UI for
 * an event no user could produce.
 *
 * The entry point is the shift itself — "Can't make it" on the card that
 * already tells you when and where you're working. A crew member finding
 * out they can't make Thursday is looking at Thursday, not hunting a
 * separate form.
 *
 * `target_user_id` stays null: this is an open ask to the manager band,
 * not a private handoff. Naming a replacement is a rostering decision and
 * the console owns it.
 */
export async function requestSwap(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  // The shift must be real, in my org, and MINE. Without the ownership
  // check any member could file a swap against a colleague's shift —
  // RLS here is only `is_org_member`, so it is no backstop.
  const { data: wfm } = await supabase
    .from("workforce_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!wfm?.id) return { error: "You don't have a workforce profile in this org yet." };

  const { data: shift } = await supabase
    .from("shifts")
    .select("id, workforce_member_id")
    .eq("id", parsed.data.shiftId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!shift) return { error: "Shift not found." };
  if (shift.workforce_member_id !== wfm.id) return { error: "That isn't your shift." };

  // One open ask per shift. Without this, tapping twice on a bad signal
  // files two swaps and the manager queue shows a duplicate.
  const { data: existing } = await supabase
    .from("shift_swaps")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("shift_id", parsed.data.shiftId)
    .eq("requested_by", session.userId)
    .in("swap_state", [...UNDECIDED_SWAP_STATES])
    .maybeSingle();
  if (existing) return { error: "You've already asked to swap this shift." };

  const { error } = await supabase.from("shift_swaps").insert({
    org_id: session.orgId,
    shift_id: parsed.data.shiftId,
    requested_by: session.userId,
    target_user_id: null,
    reason: parsed.data.reason || null,
    swap_state: "requested",
  });
  if (error) return { error: error.message };

  // Tell the people who can act on it. A swap nobody sees is a no-show
  // with extra steps.
  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Shift Swap Requested",
      body: parsed.data.reason?.slice(0, 120) || "A crew member asked to be swapped off a shift.",
      url: "/m/requests",
      kind: "shift_swap",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/schedule");
  revalidatePath("/m/requests");
  return { ok: true };
}
