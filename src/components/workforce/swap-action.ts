"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { UNDECIDED_SWAP_STATES } from "@/lib/workforce";

/**
 * Shared `requestSwap` action (ADR-0008 Amendment 4).
 *
 * Lifted from `src/app/(mobile)/m/schedule/actions.ts`. Filing a swap is a
 * form with a reason field — no geofence, no offline requirement — so under
 * the capability rule (`shell-contract.ts`) it belongs in both shells.
 *
 * This also fixes a live defect the amendment surfaced. The portal's "Swap
 * shift" CTA pointed at `/m/requests`, which is the MANAGER APPROVALS QUEUE.
 * For the crew member being shown the button, `/m/requests` is a read-only
 * list of their own asks with no create affordance — so the CTA landed them
 * on an empty page. The swap *create* only ever existed on the shift card
 * itself (`/m/schedule` → `SwapButton`). Filing now happens inline on the
 * card in both shells, which is where the mobile action's own docblock said
 * it belonged: "A crew member finding out they can't make Thursday is
 * looking at Thursday, not hunting a separate form."
 */

export type State = { error?: string; ok?: boolean } | null;

const Input = z.object({
  shiftId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
  revalidate: z.string().min(1).max(200),
});

/**
 * The manager approvals queue, refreshed on every file regardless of which
 * shell filed it. A swap raised from a laptop still has to appear in the
 * manager's mobile queue — the caller's own `revalidate` path can't know
 * that, so it isn't the caller's to pass.
 */
const MANAGER_QUEUE_PATH = "/m/requests";

/**
 * Ask to be swapped off a shift.
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
    .from("crew_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!wfm?.id) return { error: "You don't have a workforce profile in this org yet." };

  // crew_member_id, not workforce_member_id. The lookup above was repointed to
  // crew_members (the SSOT, per the workforce_members merge) without the join
  // key following it, and shifts.workforce_member_id is null on every row — so
  // this compared a crew_members.id against null and every swap came back
  // "That isn't your shift."
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, crew_member_id")
    .eq("id", parsed.data.shiftId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!shift) return { error: "Shift not found." };
  if (shift.crew_member_id !== wfm.id) return { error: "That isn't your shift." };

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
      url: MANAGER_QUEUE_PATH,
      kind: "shift_swap",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath(parsed.data.revalidate);
  if (parsed.data.revalidate !== MANAGER_QUEUE_PATH) revalidatePath(MANAGER_QUEUE_PATH);
  return { ok: true };
}
