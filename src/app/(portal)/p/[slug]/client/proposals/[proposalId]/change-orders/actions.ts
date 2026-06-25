"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { urlFor } from "@/lib/urls";
import { createChangeOrder, decideChangeOrder } from "@/lib/proposals/portal/mutations";
import type { FormState } from "@/components/FormShell";

function actor(session: { userId: string; orgId: string; email: string }) {
  return { userId: session.userId, orgId: session.orgId, userLabel: session.email.split("@")[0] ?? null };
}

export async function createChangeOrderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!title) return { error: "Title is required." };
  // redirect() signals success by THROWING NEXT_REDIRECT — it must live
  // OUTSIDE the try/catch, or the catch swallows the redirect and converts it
  // to { error: "NEXT_REDIRECT" }, stranding the user on /new even though the
  // change order was created. Capture the id in the try, redirect after.
  let coId: string;
  try {
    const co = await createChangeOrder(proposalId, { title, body }, actor(session));
    coId = co.id;
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/change-orders`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create change order." };
  }
  redirect(`/p/${slug}/client/proposals/${proposalId}/change-orders/${coId}`);
}

export async function decideChangeOrderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect(urlFor("auth", "/login"));
  const slug = String(fd.get("slug") ?? "");
  const proposalId = String(fd.get("proposalId") ?? "");
  const coId = String(fd.get("coId") ?? "");
  const decision = String(fd.get("decision") ?? "") as "approved" | "rejected";
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!coId || !["approved", "rejected"].includes(decision)) return { error: "Invalid decision." };
  try {
    await decideChangeOrder(coId, decision, note, actor(session));
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/change-orders`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}/change-orders/${coId}`);
    revalidatePath(`/p/${slug}/client/proposals/${proposalId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to record decision." };
  }
}
