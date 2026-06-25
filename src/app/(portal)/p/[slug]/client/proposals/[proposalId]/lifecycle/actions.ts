"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, can } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { toggleGateItem, approvePhase } from "@/lib/proposals/portal/mutations";

type ActionState = { error?: string; ok?: true } | null;

function actorFromSession(session: { userId: string; orgId: string; email: string }) {
  return {
    userId: session.userId,
    orgId: session.orgId,
    userLabel: session.email.split("@")[0] ?? null,
  };
}

// Phase-gate sign-off (checking gate items + approving a phase) is the same
// binding act as signing an approval — reserved for the client persona
// (`proposals:approve`) and operator manager+ (`proposals:*`). Org membership
// alone is NOT sufficient; see the approvals action sibling + RLS note.
const APPROVE_DENIED = "You are not authorized to act on this proposal lifecycle.";

export async function toggleGateAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const gateItemId = String(fd.get("gateItemId") ?? "");
  const isDone = fd.get("isDone") === "true";
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  if (!gateItemId) return { error: "Missing gate item." };
  try {
    await toggleGateItem(gateItemId, isDone, actorFromSession(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/lifecycle`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update gate." };
  }
}

export async function approvePhaseAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const phaseStateId = String(fd.get("phaseStateId") ?? "");
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  if (!phaseStateId) return { error: "Missing phase id." };
  try {
    await approvePhase(phaseStateId, actorFromSession(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/lifecycle`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to approve phase." };
  }
}
