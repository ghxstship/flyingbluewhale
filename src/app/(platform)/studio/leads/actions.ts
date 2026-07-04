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
    .from("leads")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      stage: parsed.data.stage,
      estimated_value_cents: parsed.data.estimated_value ? dollarsToCents(parsed.data.estimated_value) : null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/leads");
  redirect(`/studio/leads/${data.id}`);
}

export async function moveLeadStageAction(leadId: string, stage: z.infer<typeof Schema>["stage"]) {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ stage }).eq("org_id", session.orgId).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/studio/leads");
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
    .from("leads")
    .select("id, name, stage, notes, estimated_value_cents")
    .eq("org_id", session.orgId)
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

  if (!PROPOSAL_READY_STAGES.includes(lead.stage as (typeof PROPOSAL_READY_STAGES)[number])) {
    return { error: `Lead must be qualified before drafting a proposal (currently ${lead.stage})` };
  }

  const { data: proposal, error: insertError } = await supabase
    .from("proposals")
    .insert({
      org_id: session.orgId,
      title: `Proposal for ${lead.name}`,
      amount_cents: lead.estimated_value_cents,
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
    metadata: { leadId, amountCents: lead.estimated_value_cents },
  });

  revalidatePath("/studio/proposals");
  revalidatePath(`/studio/leads/${leadId}`);
  revalidatePath("/studio/leads");
  redirect(`/studio/proposals/${proposal.id}`);
}
