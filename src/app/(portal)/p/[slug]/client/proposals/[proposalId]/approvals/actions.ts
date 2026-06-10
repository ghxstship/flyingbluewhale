"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { signApproval, declineApproval } from "@/lib/proposals/portal/mutations";
import type { FormState } from "@/components/FormShell";

function actor(session: { userId: string; orgId: string; email: string }) {
  return { userId: session.userId, orgId: session.orgId, userLabel: session.email.split("@")[0] ?? null };
}

export async function signApprovalAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
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
