"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { GRANTABLE_CAPABILITIES, isShiftDerivable } from "@/lib/rbac/capabilities";

export type State = { error?: string; ok?: true } | null;

/**
 * Capability grant administration (ADR-0015 / audit G3 + G18).
 *
 * The grant layer shipped enforced but unadministered: `effective_capabilities`
 * resolves grants into every session, `can()` reads them, and
 * `transitionAssetState` gates on them — but `role_capability_grants` and
 * `user_capability_grants` had ZERO consumers outside the catalog and the
 * generated types. The only way to grant a capability was to write SQL against
 * production, which is not a feature, and it meant crew self-checkout could not
 * actually be turned on for a customer.
 *
 * Admin+ only, deliberately narrower than the manager band that decides
 * time off. Handing out permissions is an admin act; there is no reason a
 * shift supervisor should widen the org's authorization surface.
 *
 * Every write is audited. A permission system whose changes aren't
 * attributable is a permission system you can't answer questions about.
 */

const Capability = z.enum(GRANTABLE_CAPABILITIES);

const RoleGrant = z.object({
  crew_role_id: z.string().uuid(),
  capability: Capability,
  shift_derivable: z.coerce.boolean().default(false),
});

export async function grantRoleCapability(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change capabilities" };
  const parsed = RoleGrant.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid grant" };

  // Derivation-excluded capabilities (scan:credential) may be granted to the
  // role, but never shift-derived — the resolver would ignore the flag, so a
  // row carrying it would look configured and do nothing. Refuse instead.
  if (parsed.data.shift_derivable && !isShiftDerivable(parsed.data.capability)) {
    return {
      error:
        "Credential scanning can't be conferred by a shift. Grant it to the role or the person explicitly instead",
    };
  }

  const supabase = await createClient();
  // The role must be this org's — a crew_role_id from another tenant would
  // otherwise write a grant row scoped to our org against their role.
  const { data: role } = await supabase
    .from("crew_roles")
    .select("id, name")
    .eq("id", parsed.data.crew_role_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!role) return { error: "Role not found" };

  const { error } = await supabase.from("role_capability_grants").insert({
    org_id: session.orgId,
    crew_role_id: parsed.data.crew_role_id,
    capability: parsed.data.capability,
    shift_derivable: parsed.data.shift_derivable,
    created_by: session.userId,
  });
  if (error) {
    // Unique violation = already granted. That's the operator's intent
    // already satisfied, not an error worth showing them.
    if (error.code === "23505") return { ok: true };
    return { error: error.message };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.role_granted",
    targetTable: "role_capability_grants",
    targetId: parsed.data.crew_role_id,
    metadata: {
      capability: parsed.data.capability,
      role: (role as { name: string }).name,
      shiftDerivable: parsed.data.shift_derivable,
    },
  });

  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

const RevokeRole = z.object({ id: z.string().uuid() });

export async function revokeRoleCapability(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change capabilities" };
  const parsed = RevokeRole.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  // Role grants are hard-deleted: there is no "revoked" state on this table,
  // and the audit row is the history. Org-predicated so a stale tab can't
  // reach across tenants.
  const { data: deleted, error } = await supabase
    .from("role_capability_grants")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .select("capability, crew_role_id");
  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) return { error: "Grant not found" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.role_revoked",
    targetTable: "role_capability_grants",
    targetId: parsed.data.id,
    metadata: { capability: (deleted[0] as { capability: string }).capability },
  });

  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

const UserGrant = z.object({
  user_id: z.string().uuid(),
  capability: Capability,
  // A time-boxed grant is the cover-shift case: "Bob has the cage tonight".
  // Both bounds optional — an open-ended grant is legitimate for someone whose
  // job simply includes it.
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function grantUserCapability(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change capabilities" };
  const parsed = UserGrant.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid grant" };

  const from = parsed.data.valid_from ? new Date(parsed.data.valid_from) : null;
  const until = parsed.data.valid_until ? new Date(parsed.data.valid_until) : null;
  if (from && until && until <= from) {
    return { error: "The end of the window has to be after the start" };
  }

  const supabase = await createClient();
  // Must be a member of THIS org. Without this an admin could mint a grant
  // for any user id in the system; RLS scopes the row to the org but the
  // grant would be meaningless-or-worse rather than rejected.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("user_id", parsed.data.user_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { error: "That person isn't a member of this workspace" };

  const { error } = await supabase.from("user_capability_grants").insert({
    org_id: session.orgId,
    user_id: parsed.data.user_id,
    capability: parsed.data.capability,
    valid_from: from ? from.toISOString() : null,
    valid_until: until ? until.toISOString() : null,
    reason: parsed.data.reason || null,
    granted_by: session.userId,
  });
  if (error) return { error: error.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.user_granted",
    targetTable: "user_capability_grants",
    targetId: parsed.data.user_id,
    metadata: {
      capability: parsed.data.capability,
      validFrom: from?.toISOString() ?? null,
      validUntil: until?.toISOString() ?? null,
      reason: parsed.data.reason ?? null,
    },
  });

  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

const RevokeUser = z.object({ id: z.string().uuid() });

export async function revokeUserCapability(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change capabilities" };
  const parsed = RevokeUser.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  // Individual grants are revoked, not deleted — `revoked_at` is what
  // `effective_capabilities` filters on, and the row is the record that the
  // person once held it.
  const { data: updated, error } = await supabase
    .from("user_capability_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("revoked_at", null)
    .select("capability, user_id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Grant not found, or already revoked" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.user_revoked",
    targetTable: "user_capability_grants",
    targetId: parsed.data.id,
    metadata: { capability: (updated[0] as { capability: string }).capability },
  });

  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

// The enforcement flip deliberately does NOT live here. Flipping
// `orgs.capability_grants_enforced` is the one write on this surface that can
// lock the field out, so it goes through /studio/settings/capabilities/
// enforcement — a page that first computes who would lose access and refuses
// to flip past a non-empty loss list without an explicit acknowledgement.
// See enforcement/actions.ts.

const ShiftDerivable = z.object({
  id: z.string().uuid(),
  shift_derivable: z.coerce.boolean(),
});

/**
 * Toggle `shift_derivable` on an existing role grant — the matrix's third
 * state. When on, anyone rostered onto a shift for the role picks the
 * capability up for that shift window, which makes the SCHEDULER an
 * authorization surface. Fine for gear and stock; derivation-excluded
 * capabilities (scan:credential) are refused below, matching the guard on
 * grantRoleCapability and the hard exclusion in the SQL resolver.
 */
export async function setRoleGrantShiftDerivable(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change capabilities" };
  const parsed = ShiftDerivable.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();

  if (parsed.data.shift_derivable) {
    // Same refusal as grantRoleCapability: a flagged-but-excluded row would
    // look configured and do nothing, the worst failure mode for a
    // permission system. Read first so the refusal names the real reason
    // rather than relying on the client to have sent the capability along.
    const { data: existing } = await supabase
      .from("role_capability_grants")
      .select("capability")
      .eq("id", parsed.data.id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!existing) return { error: "Grant not found" };
    if (!isShiftDerivable((existing as { capability: string }).capability)) {
      return {
        error:
          "Credential scanning can't be conferred by a shift. Grant it to the role or the person explicitly instead",
      };
    }
  }

  const { data: updated, error } = await supabase
    .from("role_capability_grants")
    .update({ shift_derivable: parsed.data.shift_derivable })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .select("capability, crew_role_id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Grant not found" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.shift_derivable_changed",
    targetTable: "role_capability_grants",
    targetId: parsed.data.id,
    metadata: {
      capability: (updated[0] as { capability: string }).capability,
      shiftDerivable: parsed.data.shift_derivable,
    },
  });

  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}
