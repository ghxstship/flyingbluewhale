"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, can } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { signApproval, declineApproval } from "@/lib/proposals/portal/mutations";
import type { FormState } from "@/components/FormShell";

function actor(session: { userId: string; orgId: string; email: string }) {
  return { userId: session.userId, orgId: session.orgId, userLabel: session.email.split("@")[0] ?? null };
}

// Signing / declining a proposal approval is a binding, legally-meaningful
// act reserved for the CLIENT persona who received the proposal (capability
// `proposals:approve`) and operator manager+ acting on their behalf (covered
// by `proposals:*`). Gating only on org membership — as the RLS policy
// `proposal_approvals_member` does — let ANY authenticated org member (crew,
// generic member, contractor, etc.) sign the client's approval. The capability
// check below is the app-layer expression of "the client signs their own
// proposal"; it MUST stay even though RLS also passes, because RLS can't
// distinguish the persona. Guarded by
// src/lib/portal-proposal-approve-canon.test.ts.
const APPROVE_DENIED = "You are not authorized to act on this approval.";

export async function signApprovalAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const approvalId = String(fd.get("approvalId") ?? "");
  const signedLabel = String(fd.get("signedLabel") ?? "").trim();
  if (!signedLabel) return { error: "Type your name to sign." };
  try {
    await signApproval(approvalId, signedLabel, actor(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/approvals`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/approvals/${approvalId}`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/lifecycle`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to sign." };
  }
}

export async function declineApprovalAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  if (!can(session, "proposals:approve")) return { error: APPROVE_DENIED };
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const approvalId = String(fd.get("approvalId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to decline." };
  try {
    await declineApproval(approvalId, reason, actor(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/approvals`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/approvals/${approvalId}`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to decline." };
  }
}
