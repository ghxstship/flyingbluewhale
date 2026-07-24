"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: string } | null;

/**
 * Crew join/leave (PERSONA_MATRIX S-2, L-P6d) — the learner's self-service
 * writes against `legend_crew_members`. RLS: the self-insert/self-delete
 * band ships in migration 20260723180000_legend_crew_self_membership
 * (is_org_member + self-id + crew_role='member'); manager roster curation
 * keeps the manager-band policy. Insert/delete are read back explicitly —
 * a policy-blocked write on this table is a silent no-op, not an error.
 */

/** Join an active crew as a plain member. Idempotent per (crew, user). */
export async function joinCrewAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ crew_id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid crew" };
  const db = (await createClient()) as unknown as LooseSupabase;

  // The crew must exist in the caller's org and still be active.
  const { data: crew } = await db
    .from("legend_crews")
    .select("id, crew_state")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.crew_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!crew) return { error: "Crew not found" };
  if (crew.crew_state !== "active") return { error: "This crew is archived" };

  // Dupe guard (also enforced by the unique (crew_id, user_id) constraint).
  const { data: existing } = await db
    .from("legend_crew_members")
    .select("id")
    .eq("crew_id", crew.id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (existing) return { ok: "Already a member of this crew" };

  const { data: inserted, error } = await db
    .from("legend_crew_members")
    .insert({
      org_id: session.orgId,
      crew_id: crew.id,
      user_id: session.userId,
      crew_role: "member",
    })
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  // Read-back: an RLS-filtered insert returns no row and no error.
  if (!inserted) return { error: "Could not join this crew" };

  revalidatePath("/legend/crew");
  return { ok: "Joined the crew" };
}

/** Leave a crew — deletes the caller's own membership row only. */
export async function leaveCrewAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ crew_id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid crew" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: removed, error } = await db
    .from("legend_crew_members")
    .delete()
    .eq("org_id", session.orgId)
    .eq("crew_id", parsed.data.crew_id)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return { error: error.message };
  // Read-back: no returned rows means nothing was deleted (not a member, or
  // the delete was policy-filtered).
  if (!removed || removed.length === 0) return { error: "You are not a member of this crew" };

  revalidatePath("/legend/crew");
  return { ok: "Left the crew" };
}
