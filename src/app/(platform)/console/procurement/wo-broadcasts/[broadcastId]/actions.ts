"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function guardBroadcastEditable(broadcastId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_order_broadcasts")
    .select("broadcast_state")
    .eq("id", broadcastId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) return false;
  const s = (data as { broadcast_state: string }).broadcast_state;
  // Lock invitee management once the broadcast is awarded / closed /
  // cancelled — at that point the invitee list is a historical record
  // of who got the ping, not a live roster.
  return s === "draft" || s === "open";
}

const AddInviteSchema = z.object({
  broadcastId: z.string().uuid(),
  vendor_id: z.string().uuid(),
});

export async function inviteVendor(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AddInviteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  if (!(await guardBroadcastEditable(parsed.data.broadcastId, session.orgId))) return;

  const supabase = await createClient();
  // Cross-tenant guard: vendor must belong to the caller's org.
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", parsed.data.vendor_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!vendor) return;

  // Insert with conflict-tolerant pattern: a vendor already invited
  // shouldn't error — the action is idempotent from the operator's POV.
  // No unique (broadcast_id, vendor_id) constraint exists in schema; we
  // pre-check instead.
  const { data: existing } = await supabase
    .from("work_order_broadcast_invites")
    .select("id")
    .eq("broadcast_id", parsed.data.broadcastId)
    .eq("vendor_id", parsed.data.vendor_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (existing) return;

  const { error: inviteErr } = await supabase.from("work_order_broadcast_invites").insert({
    org_id: session.orgId,
    broadcast_id: parsed.data.broadcastId,
    vendor_id: parsed.data.vendor_id,
    invite_state: "invited",
  });
  if (inviteErr) throw new Error(`Could not invite vendor: ${inviteErr.message}`);

  revalidatePath(`/console/procurement/wo-broadcasts/${parsed.data.broadcastId}`);
}

const RemoveInviteSchema = z.object({
  broadcastId: z.string().uuid(),
  inviteId: z.string().uuid(),
});

export async function removeInvite(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = RemoveInviteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  if (!(await guardBroadcastEditable(parsed.data.broadcastId, session.orgId))) return;

  const supabase = await createClient();
  const { error: removeErr } = await supabase
    .from("work_order_broadcast_invites")
    .delete()
    .eq("id", parsed.data.inviteId)
    .eq("broadcast_id", parsed.data.broadcastId)
    .eq("org_id", session.orgId);
  if (removeErr) throw new Error(`Could not remove invite: ${removeErr.message}`);

  revalidatePath(`/console/procurement/wo-broadcasts/${parsed.data.broadcastId}`);
}

const AwardSchema = z.object({
  broadcastId: z.string().uuid(),
  inviteId: z.string().uuid(),
});

export async function awardToInvite(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AwardSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: invite } = await supabase
    .from("work_order_broadcast_invites")
    .select("id, vendor_id, invite_state")
    .eq("id", parsed.data.inviteId)
    .eq("broadcast_id", parsed.data.broadcastId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!invite) return;
  const inv = invite as { id: string; vendor_id: string; invite_state: string };

  // Conditional update on the parent so two simultaneous awards don't
  // both succeed — the .eq("invite_state", "open") guard means only the
  // first wins; the second sees zero rows updated and returns.
  const { data: updated, error: awardErr } = await supabase
    .from("work_order_broadcasts")
    .update({
      broadcast_state: "awarded",
      awarded_to_vendor_id: inv.vendor_id,
      awarded_at: new Date().toISOString(),
      awarded_by: session.userId,
    })
    .eq("id", parsed.data.broadcastId)
    .eq("org_id", session.orgId)
    .eq("broadcast_state", "open")
    .select("id");
  if (awardErr) throw new Error(`Could not award broadcast: ${awardErr.message}`);
  if (!updated || updated.length === 0) return; // already awarded / closed

  // Flip the winning invite to accepted; sibling invites stay
  // whatever they were (invited/viewed/declined) — preserving the
  // history of who responded how.
  const { error: acceptErr } = await supabase
    .from("work_order_broadcast_invites")
    .update({ invite_state: "accepted", responded_at: new Date().toISOString() })
    .eq("id", inv.id)
    .eq("org_id", session.orgId);
  if (acceptErr) throw new Error(`Could not accept invite: ${acceptErr.message}`);

  revalidatePath(`/console/procurement/wo-broadcasts/${parsed.data.broadcastId}`);
  revalidatePath("/console/procurement/wo-broadcasts");
}

const StatusSchema = z.object({
  broadcastId: z.string().uuid(),
  broadcast_state: z.enum(["draft", "open", "closed", "cancelled"]),
});

export async function transitionBroadcast(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = StatusSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error: transitionErr } = await supabase
    .from("work_order_broadcasts")
    .update({ broadcast_state: parsed.data.broadcast_state })
    .eq("id", parsed.data.broadcastId)
    .eq("org_id", session.orgId);
  if (transitionErr) throw new Error(`Could not transition broadcast: ${transitionErr.message}`);

  revalidatePath(`/console/procurement/wo-broadcasts/${parsed.data.broadcastId}`);
  revalidatePath("/console/procurement/wo-broadcasts");
}
