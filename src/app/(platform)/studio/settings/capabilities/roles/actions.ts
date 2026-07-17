"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { slugifyRole } from "@/lib/rbac/slugify-role";

export type State = { error?: string; ok?: true } | null;

/**
 * Role catalog administration (backlog P1.2).
 *
 * `crew_roles` was backfilled by slugifying `crew_members.role`, and
 * `slugify_role()` is deliberately never fuzzy — so "Stage Manager" and
 * "Stage Manager - cosmicMEADOW" landed as two roles that are plausibly one
 * job. Deciding that is an operator judgement, and MERGING TWO ROLES MERGES
 * THEIR PERMISSIONS, which is why the merge below demands an explicit
 * acknowledgement and shows both roles' grants side by side first.
 *
 * Band split, matching RLS rather than inventing one:
 *   create/rename — manager+ (`crew_roles_write` is the manager band;
 *     naming a role is catalog maintenance, not granting power)
 *   merge — admin (it MOVES `role_capability_grants` rows, whose write
 *     policy narrowed to admin in 20260715171424; a manager-gated merge
 *     would die halfway through at RLS, which is worse than refusing)
 */

const CreateSchema = z.object({ name: z.string().trim().min(1).max(120) });

export async function createRole(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to edit the role catalog" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Give the role a name" };

  const slug = slugifyRole(parsed.data.name);
  if (!slug) return { error: "That name has no letters or digits to key on" };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("crew_roles")
    .insert({ org_id: session.orgId, slug, name: parsed.data.name })
    .select("id")
    .maybeSingle();
  if (error) {
    // The partial unique index (org_id, slug) WHERE deleted_at IS NULL:
    // a live duplicate is refused; a merged-away role's slug is free again.
    if (error.code === "23505") return { error: "A role with that name already exists" };
    return { error: error.message };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "crew_role.created",
    targetTable: "crew_roles",
    targetId: (created as { id: string } | null)?.id ?? slug,
    metadata: { name: parsed.data.name, slug },
  });

  revalidatePath("/studio/settings/capabilities/roles");
  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

const RenameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

/**
 * Rename changes the DISPLAY NAME only. The slug is the stable key grants and
 * future backfills attach to — re-slugging on rename would detach the role
 * from the free-text spelling crew records still carry, so the same text
 * typed on a new crew row would quietly mint a duplicate role.
 */
export async function renameRole(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to edit the role catalog" };
  const parsed = RenameSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Give the role a name" };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("crew_roles")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id, slug");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Role not found" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "crew_role.renamed",
    targetTable: "crew_roles",
    targetId: parsed.data.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/studio/settings/capabilities/roles");
  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}

const MergeSchema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  acknowledged: z.coerce.boolean(),
});

/**
 * Merge `source` into `target`:
 *
 *   1. copy the source's capability grants onto the target (deduped on the
 *      (crew_role_id, capability) unique index — the target's own row wins,
 *      including its `shift_derivable` flag),
 *   2. repoint every crew member catalogued under the source,
 *   3. delete the source's grant rows,
 *   4. soft-delete the source role.
 *
 * Ordered so an interruption is never destructive: grants are COPIED before
 * anything is removed, and the source is only retired last. Re-running a
 * half-applied merge completes it.
 *
 * The free-text `crew_members.role` spelling is deliberately untouched — it
 * is the person's job title as entered. A future crew row typed with the old
 * spelling will re-mint the role via the backfill path; that is the catalog
 * doing its job, and the operator merges again.
 */
export async function mergeRoles(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Merging roles merges their permissions, which needs admin access" };
  const parsed = MergeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };
  const { source_id, target_id } = parsed.data;
  if (source_id === target_id) return { error: "Pick two different roles" };
  if (!parsed.data.acknowledged) {
    return { error: "Confirm that you have reviewed both roles' permissions before merging" };
  }

  const supabase = await createClient();
  const { data: roles, error: rolesErr } = await supabase
    .from("crew_roles")
    .select("id, name, slug")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .in("id", [source_id, target_id]);
  if (rolesErr) return { error: rolesErr.message };
  const source = (roles ?? []).find((r) => (r as { id: string }).id === source_id) as
    | { id: string; name: string; slug: string }
    | undefined;
  const target = (roles ?? []).find((r) => (r as { id: string }).id === target_id) as
    | { id: string; name: string; slug: string }
    | undefined;
  if (!source || !target) return { error: "Role not found" };

  // 1. Copy grants. ignoreDuplicates rides the (crew_role_id, capability)
  // unique index, so a capability both roles hold keeps the TARGET's row —
  // and therefore the target's shift_derivable decision.
  const { data: sourceGrants, error: grantsErr } = await supabase
    .from("role_capability_grants")
    .select("capability, shift_derivable")
    .eq("org_id", session.orgId)
    .eq("crew_role_id", source_id);
  if (grantsErr) return { error: grantsErr.message };

  if (sourceGrants && sourceGrants.length > 0) {
    const copies = (sourceGrants as { capability: string; shift_derivable: boolean }[]).map((g) => ({
      org_id: session.orgId,
      crew_role_id: target_id,
      capability: g.capability,
      shift_derivable: g.shift_derivable,
      created_by: session.userId,
    }));
    const { error: copyErr } = await supabase
      .from("role_capability_grants")
      .upsert(copies, { onConflict: "crew_role_id,capability", ignoreDuplicates: true });
    if (copyErr) return { error: copyErr.message };
  }

  // 2. Repoint the people.
  const { error: repointErr } = await supabase
    .from("crew_members")
    .update({ crew_role_id: target_id })
    .eq("org_id", session.orgId)
    .eq("crew_role_id", source_id);
  if (repointErr) return { error: repointErr.message };

  // 3. Remove the source's grant rows (their content now lives on the target).
  const { error: dropGrantsErr } = await supabase
    .from("role_capability_grants")
    .delete()
    .eq("org_id", session.orgId)
    .eq("crew_role_id", source_id);
  if (dropGrantsErr) return { error: dropGrantsErr.message };

  // 4. Retire the source. Soft delete: the partial unique index frees the
  // slug, and the row remains as the record that the role existed.
  const { error: retireErr } = await supabase
    .from("crew_roles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", source_id)
    .eq("org_id", session.orgId);
  if (retireErr) return { error: retireErr.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "crew_role.merged",
    targetTable: "crew_roles",
    targetId: target_id,
    metadata: {
      sourceId: source_id,
      sourceName: source.name,
      sourceSlug: source.slug,
      targetName: target.name,
      targetSlug: target.slug,
      grantsCopied: sourceGrants?.length ?? 0,
    },
  });

  revalidatePath("/studio/settings/capabilities/roles");
  revalidatePath("/studio/settings/capabilities");
  return { ok: true };
}
