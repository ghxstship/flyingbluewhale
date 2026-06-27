"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, can } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { createRevisionRound, decideRevisionRound } from "@/lib/proposals/portal/mutations";
import type { RevisionState } from "@/lib/proposals/portal/types";
import type { FormState } from "@/components/FormShell";

function actor(session: { userId: string; orgId: string; email: string }) {
  return { userId: session.userId, orgId: session.orgId, userLabel: session.email.split("@")[0] ?? null };
}

// Opening / deciding a creative revision round on the client portal is part of
// the same client sign-off workflow as approvals — reserved for the client
// persona (`proposals:approve`) and operator manager+ (`proposals:*`). Org
// membership alone is NOT sufficient; see the approvals action sibling.
const APPROVE_DENIED = "You are not authorized to act on this revision round.";

export async function createRevisionRoundAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const summary = String(fd.get("summary") ?? "").trim();
  const targetKind = String(fd.get("targetKind") ?? "proposal") as "proposal" | "phase" | "change_order" | "asset";
  if (!title) return { error: "Title is required." };
  // redirect() signals success by THROWING NEXT_REDIRECT — it must live
  // OUTSIDE the try/catch, or the catch swallows the redirect and converts it
  // to { error: "NEXT_REDIRECT" }, stranding the user on /new even though the
  // revision round was created. Capture the id in the try, redirect after.
  let roundId: string;
  try {
    const round = await createRevisionRound(proposalId, { title, summary, targetKind, targetId: null }, actor(session));
    roundId = round.id;
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/revisions`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create revision round." };
  }
  redirect(`/p/${slug}/client/proposals/${proposalId}/revisions/${roundId}`);
}

export async function decideRevisionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const roundId = String(fd.get("roundId") ?? "");
  const decision = String(fd.get("decision") ?? "") as RevisionState;
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!roundId || !["approved", "changes_requested", "rejected"].includes(decision)) {
    return { error: "Invalid decision." };
  }
  try {
    await decideRevisionRound(roundId, decision, note, actor(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/revisions`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/revisions/${roundId}`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to record decision." };
  }
}
