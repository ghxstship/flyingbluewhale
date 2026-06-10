"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { createRevisionRound, decideRevisionRound } from "@/lib/proposals/portal/mutations";
import type { RevisionState } from "@/lib/proposals/portal/types";
import type { FormState } from "@/components/FormShell";

function actor(session: { userId: string; orgId: string; email: string }) {
  return { userId: session.userId, orgId: session.orgId, userLabel: session.email.split("@")[0] ?? null };
}

export async function createRevisionRoundAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const summary = String(fd.get("summary") ?? "").trim();
  const targetKind = String(fd.get("targetKind") ?? "proposal") as "proposal" | "phase" | "change_order" | "asset";
  if (!title) return { error: "Title is required." };
  try {
    const round = await createRevisionRound(proposalId, { title, summary, targetKind, targetId: null }, actor(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/revisions`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    redirect(`/p/${slug}/client/proposals/${proposalId}/revisions/${round.id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create revision round." };
  }
}

export async function decideRevisionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
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
