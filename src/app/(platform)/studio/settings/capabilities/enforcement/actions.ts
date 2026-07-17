"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { computeEnforcementDiff } from "@/lib/rbac/holders";
import { fetchCapabilityGraph } from "../data";

export type State = { error?: string } | null;

const FlipSchema = z.object({
  enforced: z.coerce.boolean(),
  acknowledged: z.coerce.boolean().default(false),
});

/**
 * Flip `orgs.capability_grants_enforced` — NEVER silently (backlog P2.4).
 *
 * While the flag is false, `resolveGrants` synthesizes the legacy blanket:
 * anyone whose floor matches `check-in:write` scans everything. Flipping to
 * true is the moment configured grants become the source of truth, and if
 * they aren't configured it locks every scanner in the org out.
 *
 * So enabling RECOMPUTES the loss list server-side — the same
 * `computeEnforcementDiff` the preview page renders — and refuses to proceed
 * past a non-empty list without the acknowledgement checkbox. The
 * acknowledgement is not trusted to describe the world; the world is
 * re-measured at submit time, so a stale tab (grants revoked since the page
 * loaded) still gets an honest refusal.
 *
 * Disabling (back to grandfathered) only ever widens access, so it needs no
 * acknowledgement — but it still lands here, on a page that shows what it
 * does, and it is still audited.
 */
export async function flipEnforcement(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "You need admin access to change enforcement" };
  const parsed = FlipSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  const graph = await fetchCapabilityGraph(supabase, session.orgId);

  if (parsed.data.enforced === graph.enforced) {
    // Someone else already flipped it — nothing to do, and saying so beats
    // silently re-writing the same value with a fresh audit row.
    redirect("/studio/settings/capabilities");
  }

  let losers = 0;
  if (parsed.data.enforced) {
    const diff = computeEnforcementDiff({
      members: graph.members,
      crewRoleIdsByUser: graph.crewRoleIdsByUser,
      roleNameById: graph.roleNameById,
      roleGrants: graph.roleGrants,
      userGrants: graph.userGrants,
      now: new Date(),
    });
    losers = diff.filter((d) => d.loses.length > 0).length;
    if (losers > 0 && !parsed.data.acknowledged) {
      return {
        error:
          losers === 1
            ? "1 person would lose scan access. Review the list below and acknowledge it before flipping."
            : `${losers} people would lose scan access. Review the list below and acknowledge it before flipping.`,
      };
    }
  }

  const { error } = await supabase
    .from("orgs")
    .update({ capability_grants_enforced: parsed.data.enforced })
    .eq("id", session.orgId);
  if (error) return { error: error.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "capability.enforcement_changed",
    targetTable: "orgs",
    targetId: session.orgId,
    metadata: {
      enforced: parsed.data.enforced,
      membersLosingAccess: parsed.data.enforced ? losers : 0,
      acknowledged: parsed.data.acknowledged,
    },
  });

  revalidatePath("/studio/settings/capabilities");
  revalidatePath("/studio/settings/capabilities/enforcement");
  redirect("/studio/settings/capabilities");
}
