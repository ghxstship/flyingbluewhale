"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";
import { actionFail, formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";

// Leads live in the merged CRM store (`opportunities`, kind='lead' — ADR-0014
// Phase A amendment). The form vocabulary is unchanged; fields map onto the
// merged columns (name→title, email→contact_email, stage→lead_phase).
const Schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  source: z.string().max(80).optional().or(z.literal("")),
  stage: z.enum(["new", "qualified", "contacted", "proposal", "won", "lost"]).default("new"),
  // Sea Trial R3 FINDING-019: estimated_value optional but rejected if
  // negative or non-numeric.
  estimated_value: moneyDollarsString({ allowEmpty: true }),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createLeadAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      org_id: session.orgId,
      kind: "lead" as const,
      title: parsed.data.name,
      contact_email: parsed.data.email || null,
      contact_phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      lead_phase: parsed.data.stage,
      estimated_value_minor: parsed.data.estimated_value ? dollarsToCents(parsed.data.estimated_value) : null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/leads");
  revalidatePath("/studio/crm");
  redirect(`/studio/leads/${data.id}`);
}

export async function moveLeadStageAction(leadId: string, stage: z.infer<typeof Schema>["stage"]) {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ lead_phase: stage })
    .eq("org_id", session.orgId)
    .eq("kind", "lead")
    .eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/studio/leads");
  revalidatePath("/studio/crm");
  return { ok: true as const };
}

// Stages from which a proposal draft is a sensible next step — the lead
// is qualified (or already deeper in the funnel). new/contacted are too
// early; lost is terminal. Kept module-local: "use server" files may
// only export async functions, so the lead detail page mirrors this
// gate for button visibility while the action re-validates it here.
const PROPOSAL_READY_STAGES = ["qualified", "proposal", "won"] as const;

export type CreateProposalFromLeadState = { error?: string } | null;

/**
 * v7.8 record action — "Create Proposal". Drafts a proposals row
 * prefilled from the lead (title from the lead's name, amount from the
 * estimated value), back-linked via a `[lead:<id>]` marker appended to
 * proposals.notes — the queryable lineage key that also serves as the
 * idempotency probe (proposals has no lead FK and this action
 * deliberately ships without a migration).
 */
export async function createProposalFromLeadAction(leadId: string): Promise<CreateProposalFromLeadState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create proposals" };

  const supabase = await createClient();
  const { data: lead, error: loadError } = await supabase
    .from("opportunities")
    .select("id, title, kind, lead_phase, notes, estimated_value_minor")
    .eq("org_id", session.orgId)
    .eq("kind", "lead")
    .eq("id", leadId)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!lead) return { error: "Lead not found" };

  // Idempotency: a proposal already drafted from this lead wins — a
  // retry or double-click lands on the proposal the first click created.
  const marker = `[lead:${leadId}]`;
  const { data: existing } = await supabase
    .from("proposals")
    .select("id")
    .eq("org_id", session.orgId)
    .like("notes", `%${marker}%`)
    .is("deleted_at", null)
    .limit(1);
  const existingProposal = existing?.[0];
  if (existingProposal) {
    redirect(`/studio/proposals/${existingProposal.id}`);
  }

  const leadPhase = lead.lead_phase ?? "new";
  if (!PROPOSAL_READY_STAGES.includes(leadPhase as (typeof PROPOSAL_READY_STAGES)[number])) {
    return { error: `Lead must be qualified before drafting a proposal (currently ${leadPhase})` };
  }

  const { data: proposal, error: insertError } = await supabase
    .from("proposals")
    .insert({
      org_id: session.orgId,
      title: `Proposal for ${lead.title}`,
      amount_cents: lead.estimated_value_minor,
      notes: [lead.notes, `Drafted from lead ${marker}`].filter(Boolean).join("\n\n"),
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "lead.proposal_created",
    targetTable: "proposals",
    targetId: proposal.id,
    metadata: { leadId, amountCents: lead.estimated_value_minor },
  });

  revalidatePath("/studio/proposals");
  revalidatePath(`/studio/leads/${leadId}`);
  revalidatePath("/studio/leads");
  redirect(`/studio/proposals/${proposal.id}`);
}

const LEAD_STAGES = ["new", "qualified", "contacted", "proposal", "won", "lost"] as const;

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/** Bulk stage move over the merged CRM store (audit A-22). Org-pinned and
 *  kind-pinned to leads; rows already at the target stage are skipped. */
async function bulkSetLeadStage(ids: string[], stage: (typeof LEAD_STAGES)[number]): Promise<BulkResult> {
  const session = await requireSession();
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("opportunities")
    .update({ lead_phase: stage })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .eq("kind", "lead")
    .neq("lead_phase", stage)
    .select("id");
  if (error) return { error: `Could Not Update · ${error.message}` };
  const moved = updated?.length ?? 0;
  const skipped = parsed.data.length - moved;
  revalidatePath("/studio/leads");
  revalidatePath("/studio/crm");
  const label = stage.charAt(0).toUpperCase() + stage.slice(1);
  if (skipped > 0) return { error: `${moved} Marked ${label} · ${skipped} Skipped (already there or not found)` };
  return { message: `${moved} ${moved === 1 ? "Lead" : "Leads"} Marked ${label}` };
}

export async function bulkQualifyLeads(ids: string[]): Promise<BulkResult> {
  return bulkSetLeadStage(ids, "qualified");
}

export async function bulkLoseLeads(ids: string[]): Promise<BulkResult> {
  return bulkSetLeadStage(ids, "lost");
}

/**
 * Inline cell edit for the leads list (audit A-13). Whitelisted columns
 * only; the stage enum is validated server-side. Throws on rejection so
 * the table's optimistic override rolls back.
 */
export async function editLeadCell(rowId: string, columnKey: string, value: string): Promise<void> {
  const session = await requireSession();
  const id = z.string().uuid().parse(rowId);
  let patch: { title: string } | { lead_phase: (typeof LEAD_STAGES)[number] };
  if (columnKey === "name") {
    const title = value.trim();
    if (!title || title.length > 120) throw new Error("Name must be 1 to 120 characters");
    patch = { title };
  } else if (columnKey === "stage") {
    const next = value.trim().toLowerCase();
    if (!(LEAD_STAGES as readonly string[]).includes(next)) {
      throw new Error(`Stage must be one of: ${LEAD_STAGES.join(", ")}`);
    }
    patch = { lead_phase: next as (typeof LEAD_STAGES)[number] };
  } else {
    throw new Error("Column is not editable");
  }
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("opportunities")
    .update(patch)
    .eq("org_id", session.orgId)
    .eq("kind", "lead")
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("Lead not found");
  revalidatePath("/studio/leads");
  revalidatePath("/studio/crm");
}
