"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { offboardMembershipInOrg } from "@/lib/db/offboard";
import { emitAudit } from "@/lib/audit";

export type State = { error?: string; ok?: true } | null;

const Schema = z.object({ org_id: z.string().uuid() });

/**
 * Set the active workspace from /me/organizations (AUDIT C-28 — the rows
 * were inert despite the "Memberships and switcher" promise). Mirrors the
 * console switcher's PATCH /api/v1/me/workspaces: membership check first,
 * then flip `user_preferences.last_org_id`, which `getSession` reads to
 * resolve the tenant on the next navigation.
 */
export async function setActiveWorkspaceAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing organization." };
  const orgId = parsed.data.org_id;

  const supabase = await createClient();
  // Confirm live membership before flipping the pointer — RLS would block
  // silently, but a clear failure mode matters; and .is("deleted_at", null)
  // keeps an offboarded user from re-activating themselves into the org.
  const { data: member } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", session.userId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { error: "You are not a member of that workspace." };

  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, last_org_id: orgId }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  if (orgId !== session.orgId) {
    await emitAudit({
      actorId: session.userId,
      orgId,
      actorEmail: session.email,
      action: "auth.org.switched",
      metadata: { from: session.orgId, to: orgId, via: "/me/organizations" },
    });
  }

  revalidatePath("/me/organizations");
  revalidatePath("/me");
  return { ok: true };
}

/**
 * Voluntary self-departure — the "leave-org flow" the console offboarding
 * (removePerson) defers to. A member removes THEMSELVES from one org while
 * keeping their account and any other memberships. Same soft-delete + cascade
 * as the admin path (offboardMembershipInOrg), plus:
 *   - a last-owner guard: the only remaining owner must transfer ownership
 *     first (else the org is orphaned) — this is the counterpart to the guard
 *     in removePerson/updatePerson;
 *   - active-workspace repair: if you leave your CURRENT workspace, the pointer
 *     is moved to another membership (or cleared) so the next navigation resolves.
 */
export async function leaveOrgAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing organization." };
  const orgId = parsed.data.org_id;

  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", session.userId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!mine) return { error: "You are not a member of that workspace." };

  // Last-owner guard — an owner can't abandon the org with zero owners.
  if ((mine as { role: string }).role === "owner") {
    const { count: ownerCount } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "owner")
      .is("deleted_at", null);
    if ((ownerCount ?? 0) <= 1) {
      return { error: "You're the last owner — transfer ownership before leaving this organization." };
    }
  }

  // Self-departure is a PRIVILEGED anti-bricking flow and must run on the
  // service client: `memberships_update_admin` gates UPDATE on
  // has_org_role(owner|admin), so a member soft-deleting their OWN membership
  // is RLS-denied and the leave silently no-ops. (Same reason /api/v1/me/delete
  // revokes memberships with the service client.) The authorization check above
  // — a live membership, and the last-owner guard — already ran on the caller's
  // own session, so this only elevates the teardown, not the decision.
  if (!isServiceClientAvailable()) {
    return { error: "Leaving an organization requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment." };
  }
  const left = await offboardMembershipInOrg(createServiceClient(), session.userId, orgId);
  if (!left) return { error: "You are not a member of that workspace." };

  await emitAudit({
    actorId: session.userId,
    orgId,
    actorEmail: session.email,
    action: "auth.member.left",
    targetTable: "memberships",
    targetId: session.userId,
    metadata: { via: "/me/organizations" },
  });

  // Repair the active-workspace pointer if you just left the org it pointed at,
  // so the next navigation resolves to a workspace you're still in (or none).
  if (orgId === session.orgId) {
    const { data: remaining } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    const nextOrgId = (remaining as { org_id: string } | null)?.org_id ?? null;
    await (
      supabase.from("user_preferences") as unknown as {
        upsert: (
          p: Record<string, unknown>,
          opts?: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).upsert({ user_id: session.userId, last_org_id: nextOrgId }, { onConflict: "user_id" });
  }

  revalidatePath("/me/organizations");
  revalidatePath("/me");
  return { ok: true };
}
