"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { ensureMyPartyId, ensurePartyForMember } from "@/lib/db/parties";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { maxVersion } from "@/lib/clm/queries";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * Verify the contract is org-scoped to the caller before any child write.
 * Child tables (versions/milestones/etc.) have no org_id, so this is the
 * only tenancy gate available app-side — RLS still backstops it.
 */
type GuardResult = { error: string } | { ok: true; sb: LooseSupabase };

async function guard(contractId: string): Promise<GuardResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.edit-contracts", "Only manager+ can edit contracts") };
  const contract = await getOrgScoped("contracts", session.orgId, contractId);
  if (!contract) return { error: actionErrorMessage("not-found.contract", "Contract not found") };
  const supabase = await createClient();
  return { ok: true, sb: supabase as unknown as LooseSupabase };
}

function refresh(contractId: string) {
  revalidatePath(`/studio/legal/contracts/${contractId}`);
}

// ── Milestones ──────────────────────────────────────────────────────────
const MilestoneSchema = z.object({
  contract_id: z.string().uuid(),
  label: z.string().min(1).max(200),
  due_at: z.string().optional().or(z.literal("")),
  payment_usd: z.string().optional().or(z.literal("")),
  trigger_kind: z.string().min(1).max(80),
});

export async function addMilestone(_: State, fd: FormData): Promise<State> {
  const parsed = MilestoneSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const minor = d.payment_usd ? Math.round(Number(d.payment_usd) * 100) : null;
  if (minor != null && !Number.isFinite(minor)) return actionFail(actionErrorMessage("bad-payment-amount", "Bad payment amount"), fd);
  const { error } = await g.sb.from("contract_milestones").insert({
    contract_id: d.contract_id,
    label: d.label,
    due_at: d.due_at ? new Date(d.due_at).toISOString() : null,
    trigger_kind: d.trigger_kind,
    payment_amount_minor: minor,
    payment_currency: minor != null ? "USD" : null,
    // state omitted — DB default 'pending'.
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}

// ── Obligations ───────────────────────────────────────────────────────────
const ObligationSchema = z.object({
  contract_id: z.string().uuid(),
  ob_kind: z.string().min(1).max(80),
  description: z.string().min(1).max(1000),
  recurring: z.string().optional(),
  due_at: z.string().optional().or(z.literal("")),
});

export async function addObligation(_: State, fd: FormData): Promise<State> {
  const parsed = ObligationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const { error } = await g.sb.from("contract_obligations").insert({
    contract_id: d.contract_id,
    ob_kind: d.ob_kind,
    description: d.description,
    recurring: d.recurring === "on",
    due_at: d.due_at ? new Date(d.due_at).toISOString() : null,
    state: "open", // NOT-NULL, no DB default — set explicitly.
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}

// ── Parties ───────────────────────────────────────────────────────────────
const PartySchema = z.object({
  contract_id: z.string().uuid(),
  party_user_id: z.string().optional().or(z.literal("")),
  role: z.string().min(1).max(80),
  signing_capacity: z.string().max(120).optional().or(z.literal("")),
});

export async function addParty(_: State, fd: FormData): Promise<State> {
  const parsed = PartySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const session = await requireSession();
  // The form selects a MEMBER (auth user); contract_parties.party_id is a
  // parties.id — resolve through the party layer (get-or-create, org-checked).
  const partyId = d.party_user_id
    ? await ensurePartyForMember(session.orgId, d.party_user_id)
    : await ensureMyPartyId(session.orgId, session.userId, session.email);
  if (!partyId) return actionFail(actionErrorMessage("selected-person-is-not-a-member-of-this-workspace", "Selected person is not a member of this workspace"), fd);
  const { error } = await g.sb.from("contract_parties").insert({
    contract_id: d.contract_id,
    party_id: partyId,
    role: d.role,
    signing_capacity: d.signing_capacity || null,
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}

// ── Terms ─────────────────────────────────────────────────────────────────
const TermSchema = z.object({
  contract_id: z.string().uuid(),
  term_kind: z.string().min(1).max(80),
  description: z.string().min(1).max(1000),
});

export async function addTerm(_: State, fd: FormData): Promise<State> {
  const parsed = TermSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const { error } = await g.sb.from("contract_terms").insert({
    contract_id: d.contract_id,
    term_kind: d.term_kind,
    description: d.description,
    // value (default {}) + active (default true) omitted.
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}

// ── Versions ──────────────────────────────────────────────────────────────
const VersionSchema = z.object({
  contract_id: z.string().uuid(),
  redline_summary: z.string().max(2000).optional().or(z.literal("")),
});

export async function addVersion(_: State, fd: FormData): Promise<State> {
  const parsed = VersionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const next = (await maxVersion(d.contract_id)) + 1;
  const { error } = await g.sb.from("contract_versions").insert({
    contract_id: d.contract_id,
    version: next, // NOT-NULL, no default — increment max.
    redline_summary: d.redline_summary || null,
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}

// ── Signatures ────────────────────────────────────────────────────────────
const SignatureSchema = z.object({
  contract_id: z.string().uuid(),
  version_id: z.string().uuid("Add a version first"),
  signer_user_id: z.string().uuid("Pick a signer"),
  signing_role: z.string().min(1).max(80),
  signature_method: z.string().min(1).max(40),
});

export async function recordSignature(_: State, fd: FormData): Promise<State> {
  const parsed = SignatureSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const g = await guard(parsed.data.contract_id);
  if (!("ok" in g)) return g;
  const d = parsed.data;
  const session = await requireSession();
  // The form selects a MEMBER (auth user); signer_party_id is a parties.id.
  const signerPartyId = await ensurePartyForMember(session.orgId, d.signer_user_id);
  if (!signerPartyId) return actionFail(actionErrorMessage("selected-signer-is-not-a-member-of-this-workspace", "Selected signer is not a member of this workspace"), fd);
  const { error } = await g.sb.from("contract_signatures").insert({
    contract_id: d.contract_id,
    version_id: d.version_id,
    signer_party_id: signerPartyId,
    signing_role: d.signing_role,
    signature_method: d.signature_method,
    state: "signed", // NOT-NULL, no DB default.
    signed_at: new Date().toISOString(),
  });
  if (error) return actionFail(error.message, fd);
  refresh(d.contract_id);
  return { ok: true };
}
