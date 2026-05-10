"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";

const Schema = z
  .object({
    title: z.string().min(1).max(200),
    client_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    // Sea Trial R3 FINDING-019: amount optional but must be a valid
    // non-negative dollar amount when supplied.
    amount: moneyDollarsString({ allowEmpty: true }),
    expires_at: z.string().date().optional().or(z.literal("")),
    notes: z.string().max(4000).optional(),
  })
  // Sea Trial R3 FINDING-021: expires_at, when supplied, must not be in
  // the past. A 30-day grace window allows legitimate backdating
  // (porting historical proposals) without permitting "expired before
  // it was created" as a fresh-author error.
  .refine(
    (data) => {
      if (!data.expires_at) return true;
      const exp = Date.parse(data.expires_at);
      if (!Number.isFinite(exp)) return false;
      const grace = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return exp >= grace;
    },
    { message: "Expires-at is too far in the past", path: ["expires_at"] },
  );

export type State = { error?: string } | null;

export async function createProposalAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();

  // Cross-tenant FK guards. Proposals are quotable instruments —
  // dangling client_id or project_id corrupts the sales pipeline.
  const clientId = parsed.data.client_id || null;
  const projectId = parsed.data.project_id || null;
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!client) return { error: "Client not found in your organization" };
  }
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      client_id: clientId,
      project_id: projectId,
      amount_cents: parsed.data.amount ? dollarsToCents(parsed.data.amount) : null,
      expires_at: parsed.data.expires_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/proposals");
  redirect(`/console/proposals/${data.id}`);
}

// Proposal FSM: draft → sent → signed (or → approved/rejected/expired
// at any non-terminal state). Without state guards, calling
// setProposalStatusAction(id, "sent") twice would re-stamp sent_at +
// double-fire the "Proposal sent" notification. Same for signed.
const PROPOSAL_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["sent", "expired"],
  sent: ["signed", "approved", "rejected", "expired"],
  approved: ["signed", "expired"],
  rejected: [],
  expired: [],
  signed: [], // terminal
};

export async function setProposalStatusAction(
  id: string,
  status: "draft" | "sent" | "approved" | "rejected" | "expired" | "signed",
) {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("proposals")
    .select("doc_number, title, amount_cents, created_by, status")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!before) return { error: "Proposal not found" };
  const current = before.status as string;
  const allowed = PROPOSAL_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move ${current} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }
  const patch: { status: typeof status; sent_at?: string; signed_at?: string } = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "signed") patch.signed_at = new Date().toISOString();
  // Conditional update on the observed status closes the TOCTOU
  // between the SELECT above and the write — without it concurrent
  // setProposalStatusAction calls would silently re-stamp + double-
  // fire the notify() below.
  const { data: updated, error } = await supabase
    .from("proposals")
    .update(patch)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("status", current as "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Proposal status changed concurrently — refresh and retry" };
  if (status === "sent" || status === "signed") {
    const { notify } = await import("@/lib/notify");
    await notify({
      orgId: session.orgId,
      userId: before.created_by ?? session.userId,
      eventType: status === "signed" ? "proposal.signed" : "proposal.sent",
      title:
        status === "signed"
          ? `Proposal ${before.doc_number ?? id.slice(0, 8)} signed`
          : `Proposal ${before.doc_number ?? id.slice(0, 8)} sent`,
      body: before.title ?? undefined,
      href: `/console/proposals/${id}`,
      data: { proposalId: id, amountCents: before.amount_cents, number: before.doc_number },
    });
  }
  revalidatePath(`/console/proposals/${id}`);
  revalidatePath("/console/proposals");
  return { ok: true as const };
}
