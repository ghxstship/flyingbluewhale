"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { resolveDepositPct, PROPOSAL_DEPOSIT_PCT_DEFAULT } from "@/lib/payment-terms";
import { getOrgPaymentDefaults } from "@/lib/payment-terms-server";
import { actionErrorMessage } from "@/lib/errors";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const Schema = z
  .object({
    title: z.string().min(1).max(200),
    client_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    // Optional template seed — when provided, copies blocks + theme
    // from the referenced proposal_templates row into the new proposal.
    template_id: z.string().uuid().optional().or(z.literal("")),
    // Canonical money entry: <MoneyInput> submits integer cents directly.
    amount_cents: z.coerce.number().int().nonnegative().optional(),
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

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createProposalAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Proposals are sales documents; manager+ only at app layer.
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-proposals", "Only manager+ can create proposals") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

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
    if (!client) return { error: actionErrorMessage("not-found.client-in-org", "Client not found in your organization") };
  }
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }

  // Resolve the template seed iff requested. RLS guarantees the caller
  // can only see system rows + their org's rows, so a leak through the
  // template_id query parameter would already be blocked at the SELECT.
  let seedBlocks: unknown = [];
  let seedTheme: unknown = { primary: "#D4782A", secondary: "#6D4A2A" };
  const templateId = parsed.data.template_id || null;
  if (templateId) {
    const loose = supabase as unknown as LooseSupabase;
    const { data: tpl } = await loose
      .from("proposal_templates")
      .select("id, blocks, theme")
      .eq("id", templateId)
      .is("deleted_at", null)
      .maybeSingle();
    if (tpl) {
      const t = tpl as { blocks?: unknown; theme?: unknown };
      seedBlocks = t.blocks ?? [];
      if (t.theme) seedTheme = t.theme;
    }
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      client_id: clientId,
      project_id: projectId,
      amount_cents: parsed.data.amount_cents ?? null,
      expires_at: parsed.data.expires_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
      blocks: seedBlocks as never,
      theme: seedTheme as never,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/proposals");
  redirect(`/studio/proposals/${data.id}`);
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
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.change-proposal-status", "Only manager+ can change proposal status") };
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("proposals")
    .select("doc_number, title, amount_cents, created_by, proposal_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!before) return { error: actionErrorMessage("not-found.proposal", "Proposal not found") };
  const current = before.proposal_state as string;
  const allowed = PROPOSAL_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move ${current} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }
  const patch: {
    proposal_state: "draft" | "sent" | "approved" | "rejected" | "expired" | "signed";
    sent_at?: string;
    signed_at?: string;
  } = { proposal_state: status };
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
    .eq("proposal_state", current as "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: actionErrorMessage("concurrency.proposal-status", "Proposal status changed concurrently. Refresh and retry") };
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
      href: `/studio/proposals/${id}`,
      data: { proposalId: id, amountCents: before.amount_cents, number: before.doc_number },
    });
  }
  revalidatePath(`/studio/proposals/${id}`);
  revalidatePath("/studio/proposals");
  return { ok: true as const };
}

// Convert a signed proposal into a live project + deposit/balance
// invoices. Generic and content-agnostic: the action only carries
// fields that are universal to every proposal (title, client, money,
// deposit split). Downstream seeding — SOW → deliverables, components
// → master_catalog_items, phase milestones — happens in follow-up
// surfaces against the resulting project_id.
//
// Idempotency layers (each independently sufficient):
//   1. DB unique partial index `projects_proposal_id_unique` rejects a
//      second insert at the same proposal_id.
//   2. App-level pre-check returns the existing project id on retry so
//      double-clicks land on the same destination instead of erroring.
//   3. The proposal-side back-pointer (proposals.project_id) is set on
//      the success path; if it is already populated and points at a
//      live project, the action treats that as already-converted.
//
// Requires proposal.status='signed' — the FSM is the authorization
// gate. A signed proposal is the contract; converting it materialises
// the production engagement.
export type ConvertProposalState = { error?: string; projectId?: string } | null;

export async function convertProposalToProjectAction(proposalId: string): Promise<ConvertProposalState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.convert-proposals", "Only manager+ can convert proposals") };

  const supabase = await createClient();

  const { data: proposal, error: loadError } = await supabase
    .from("proposals")
    .select(
      "id, org_id, title, client_id, project_id, amount_cents, proposal_state, deposit_percent, currency, doc_number, notes, blocks",
    )
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .is("deleted_at", null)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!proposal) return { error: actionErrorMessage("not-found.proposal", "Proposal not found") };
  if (proposal.proposal_state !== "signed") {
    return { error: `Proposal must be signed before conversion (currently ${proposal.proposal_state})` };
  }

  // Layer 2: app-level idempotency via the new reverse FK. If a project
  // already cites this proposal, return it.
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("proposal_id", proposalId)
    .is("deleted_at", null)
    .maybeSingle();
  const existingId = existing?.id;
  if (existingId) {
    revalidatePath(`/studio/proposals/${proposalId}`);
    redirect(`/studio/projects/${existingId}`);
  }

  // Layer 3: the proposal was manually attached to a pre-existing
  // project. Adopt that project as the conversion target and backfill
  // the reverse pointer so subsequent lookups short-circuit at layer 2.
  if (proposal.project_id) {
    const { data: attached } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", proposal.project_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (attached) {
      await supabase
        .from("projects")
        .update({ proposal_id: proposalId })
        .eq("org_id", session.orgId)
        .eq("id", attached.id);
      revalidatePath(`/studio/proposals/${proposalId}`);
      redirect(`/studio/projects/${attached.id}`);
    }
  }

  // Derive a unique slug within the org. The (org_id, slug) UNIQUE
  // constraint on projects means a colliding slug would 23505 the
  // insert; suffixing pre-empts that without a retry loop on insert.
  const baseSlug = slugify(proposal.title) || `project-${proposalId.slice(0, 8)}`;
  let slug = baseSlug;
  for (let suffix = 2; suffix <= 99; suffix++) {
    const { data: clash } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${suffix}`;
    if (suffix === 99) return { error: actionErrorMessage("could-not-derive-a-unique-project-slug", "Could not derive a unique project slug") };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      org_id: session.orgId,
      slug,
      name: proposal.title,
      description: proposal.notes ?? null,
      project_state: "active",
      xpms_phase: "Discover",
      client_id: proposal.client_id,
      budget_cents: proposal.amount_cents,
      proposal_id: proposalId,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (projectError) return { error: projectError.message };
  const projectId = project.id;

  // Backfill the proposal → project pointer iff still empty. Avoids
  // clobbering a deliberately-attached prior project.
  if (!proposal.project_id) {
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ project_id: projectId })
      .eq("org_id", session.orgId)
      .eq("id", proposalId)
      .is("project_id", null);
    if (updateError) return { error: updateError.message };
  }

  // Seed deposit + balance invoices via the canonical payment-terms
  // resolution: per-instance proposal.deposit_percent → org template default
  // → system default (50/50). The single owner is src/lib/payment-terms.ts —
  // no hardcoded split here (plumb-line DUP-1/DUP-6).
  if (proposal.amount_cents && proposal.amount_cents > 0) {
    const orgDefaults = await getOrgPaymentDefaults(supabase, session.orgId);
    const depositPct = resolveDepositPct(proposal.deposit_percent, orgDefaults.depositPct, PROPOSAL_DEPOSIT_PCT_DEFAULT);
    const depositCents = Math.round((proposal.amount_cents * depositPct) / 100);
    const balanceCents = proposal.amount_cents - depositCents;
    const currency = proposal.currency ?? "USD";
    const numBase = (proposal.doc_number ?? proposalId.slice(0, 8)).toUpperCase();
    const { error: invoiceError } = await supabase.from("invoices").insert([
      {
        org_id: session.orgId,
        project_id: projectId,
        client_id: proposal.client_id,
        number: `${numBase}-D`,
        title: `${proposal.title} · Deposit (${depositPct}%)`,
        amount_cents: depositCents,
        currency,
        invoice_state: "draft",
        created_by: session.userId,
      },
      {
        org_id: session.orgId,
        project_id: projectId,
        client_id: proposal.client_id,
        number: `${numBase}-B`,
        title: `${proposal.title} · Balance on Load-In (${100 - depositPct}%)`,
        amount_cents: balanceCents,
        currency,
        invoice_state: "draft",
        created_by: session.userId,
      },
    ]);
    // Soft-fail the invoice seed: the project exists, conversion is
    // committed, the operator can hand-create invoices if the seed
    // collided on (org_id, number) due to a re-conversion edge case.
    if (invoiceError) {
      const { log } = await import("@/lib/log");
      log.warn("convert_proposal.invoice_seed_failed", {
        proposalId,
        projectId,
        err: invoiceError.message,
      });
    }
  }

  // Walk the proposal's blocks JSONB and materialise downstream rows
  // (deliverables, master_catalog_items, budgets). Each step soft-
  // fails internally so a partial seed never undoes the project — the
  // operator can finish by hand if any step errors. See
  // src/lib/proposals/seed.ts for the lineage rules.
  const { seedFromBlocks } = await import("@/lib/proposals/seed");
  const seedResult = await seedFromBlocks({
    orgId: session.orgId,
    projectId,
    blocks: proposal.blocks,
    doc_number: proposal.doc_number,
  });

  const { notify } = await import("@/lib/notify");
  await notify({
    orgId: session.orgId,
    userId: session.userId,
    eventType: "project.created",
    title: `Project created from proposal ${proposal.doc_number ?? proposalId.slice(0, 8)}`,
    body: proposal.title,
    href: `/studio/projects/${projectId}`,
    data: {
      projectId,
      proposalId,
      targetTable: "projects",
      targetId: projectId,
      seedDeliverables: seedResult.deliverables,
      seedCatalog: seedResult.catalog,
      seedBudgets: seedResult.budgets,
    },
  });

  revalidatePath("/studio/projects");
  revalidatePath("/studio/proposals");
  revalidatePath(`/studio/proposals/${proposalId}`);
  redirect(`/studio/projects/${projectId}`);
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk-send draft proposals from the list table (audit A-22). manager+
 * only; org-pinned; non-draft rows are skipped and reported. Stamps
 * sent_at like the single-record transition.
 */
export async function bulkSendProposals(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.send-proposals", "You Need Manager Access To Send Proposals") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("proposals")
    .update({ proposal_state: "sent", sent_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("proposal_state", "draft")
    .select("id");
  if (error) return { error: `Could Not Send · ${error.message}` };
  const sent = updated?.length ?? 0;
  const skipped = parsed.data.length - sent;
  revalidatePath("/studio/proposals");
  if (skipped > 0) return { error: `${sent} Sent · ${skipped} Skipped (not in draft)` };
  return { message: `${sent} ${sent === 1 ? "Proposal" : "Proposals"} Sent` };
}
