import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Advancing & Onboarding Merge Engine (kit 27) — canonical domain lib.
 *
 * Every advance campaign is the same machine: a scoped information packet
 * out, a structured submission back, against a deadline, per counterparty.
 * The packet (sections × audiences × requirement matrix) is authored per
 * project; the merge engine renders one personalized send per recipient;
 * the portal token is the recipient's only credential.
 *
 * Mirrors the `assignments` canon shape: tuples + label maps + FSM guards +
 * read helpers, with append-only `*_state_transitions` ledgers written on
 * every transition (LDP §SCHEMA PATTERNS).
 */

// ── Tuples (enum-sync guarded against Constants.public.Enums.*) ────────────

export const ADVANCE_PACKET_STATES = ["draft", "live", "archived"] as const;
export type AdvancePacketState = (typeof ADVANCE_PACKET_STATES)[number];

export const ADVANCE_SECTION_KEYS = [
  "overview",
  "schedule_milestones",
  "crew_list",
  "production_advance",
  "travel_lodging",
  "safety",
  "parking_load_in",
  "tech",
  "catering",
  "credentials",
  "custom",
] as const;
export type AdvanceSectionKey = (typeof ADVANCE_SECTION_KEYS)[number];

export const ADVANCE_SECTION_LABEL: Record<AdvanceSectionKey, string> = {
  overview: "Overview",
  schedule_milestones: "Schedule & Milestones",
  crew_list: "Crew List",
  production_advance: "Production Advance",
  travel_lodging: "Travel & Lodging",
  safety: "Safety On Site",
  parking_load_in: "Parking & Load-In",
  tech: "Tech & Riders",
  catering: "Catering",
  credentials: "Credentials",
  custom: "Custom",
};

export const ADVANCE_REQUIREMENTS = ["required", "optional", "hidden"] as const;
export type AdvanceRequirement = (typeof ADVANCE_REQUIREMENTS)[number];

export const ADVANCE_ASSIGNED_VIA = ["org_preset", "project_preset", "manual", "contract_override"] as const;
export type AdvanceAssignedVia = (typeof ADVANCE_ASSIGNED_VIA)[number];

export const ADVANCE_BATCH_STATES = ["draft", "scheduled", "sending", "sent", "failed"] as const;
export type AdvanceBatchState = (typeof ADVANCE_BATCH_STATES)[number];

export const ADVANCE_DELIVERY_STATES = [
  "queued",
  "delivered",
  "bounced",
  "opened",
  "started",
  "submitted",
  "complete",
] as const;
export type AdvanceDeliveryState = (typeof ADVANCE_DELIVERY_STATES)[number];

export const ADVANCE_SUBMISSION_STATES = ["draft", "submitted", "accepted", "returned"] as const;
export type AdvanceSubmissionState = (typeof ADVANCE_SUBMISSION_STATES)[number];

export const ADVANCE_DEADLINE_KINDS = ["t5_reminder", "t2_reminder", "lapse", "allocation_confirm"] as const;
export type AdvanceDeadlineKind = (typeof ADVANCE_DEADLINE_KINDS)[number];

export const ADVANCE_VOICES = ["neutral", "flair"] as const;
export type AdvanceVoice = (typeof ADVANCE_VOICES)[number];

// ── State machines (server-enforced; a stale tab can't write an illegal jump) ─

export const NEXT_PACKET_STATES: Record<AdvancePacketState, AdvancePacketState[]> = {
  draft: ["live", "archived"],
  live: ["draft", "archived"],
  archived: ["draft"],
};

export const NEXT_BATCH_STATES: Record<AdvanceBatchState, AdvanceBatchState[]> = {
  draft: ["scheduled", "sending"],
  scheduled: ["sending", "draft"],
  sending: ["sent", "failed"],
  sent: [],
  failed: ["draft", "sending"],
};

/**
 * The delivery funnel is forward-only (queued → delivered → opened →
 * started → submitted → complete), with `bounced` reachable only from the
 * pre-engagement states. A webhook/portal ping that arrives out of order
 * (open after started) must never regress the funnel.
 */
const DELIVERY_ORDER: Record<AdvanceDeliveryState, number> = {
  queued: 0,
  bounced: 1,
  delivered: 1,
  opened: 2,
  started: 3,
  submitted: 4,
  complete: 5,
};

export function canAdvanceDelivery(from: AdvanceDeliveryState, to: AdvanceDeliveryState): boolean {
  if (from === to) return false;
  if (to === "bounced") return from === "queued" || from === "delivered";
  if (from === "bounced") return false;
  return DELIVERY_ORDER[to] > DELIVERY_ORDER[from];
}

export const NEXT_SUBMISSION_STATES: Record<AdvanceSubmissionState, AdvanceSubmissionState[]> = {
  draft: ["submitted"],
  submitted: ["accepted", "returned"],
  returned: ["submitted"],
  accepted: ["returned"],
};

// ── Row types ───────────────────────────────────────────────────────────────

export type AdvanceContact = { name?: string; email: string; phone?: string };

export type AdvancePacket = {
  id: string;
  org_id: string;
  project_id: string;
  job_id: string | null;
  version: number;
  voice: string;
  packet_state: AdvancePacketState;
  support_contact: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvancePacketSection = {
  id: string;
  org_id: string;
  packet_id: string;
  section_key: AdvanceSectionKey;
  title: string;
  body: Record<string, unknown>;
  sort_order: number;
  deliverable_types: string[];
  submission_schema_key: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvanceAudience = {
  id: string;
  org_id: string;
  packet_id: string;
  company: string;
  department: string | null;
  team: string | null;
  role: string | null;
  scope: string | null;
  contract_id: string | null;
  external_scheduler_url: string | null;
  contacts: AdvanceContact[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvanceSectionAssignment = {
  id: string;
  org_id: string;
  audience_id: string;
  section_id: string;
  requirement: AdvanceRequirement;
  due_at: string | null;
  assigned_via: AdvanceAssignedVia;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvanceSendBatch = {
  id: string;
  org_id: string;
  packet_id: string;
  template_id: string | null;
  subject: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  batch_state: AdvanceBatchState;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvanceSendRecipient = {
  id: string;
  org_id: string;
  batch_id: string;
  audience_id: string | null;
  contact: AdvanceContact;
  render_snapshot: Record<string, unknown> | null;
  delivery_state: AdvanceDeliveryState;
  portal_token: string;
  late_flagged_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdvanceSubmission = {
  id: string;
  org_id: string;
  recipient_id: string;
  section_id: string;
  schema_key: string;
  rows: Array<Record<string, unknown>>;
  submission_state: AdvanceSubmissionState;
  received_via: "portal" | "email_ingest";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// ── Contract ID derivation (decision #1) ───────────────────────────────────
//
// The Job ID (requisition, created at RFP) is the SSOT join key; the
// Contract ID is a DERIVED reference, never manually issued. Grammar:
// `CT-<first 8 of the requisition uuid, uppercase>` — stable, human-quotable,
// reversible back to the requisition by prefix match.

export function deriveContractId(jobId: string | null | undefined): string | null {
  if (!jobId) return null;
  return `CT-${jobId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// ── Read helpers ────────────────────────────────────────────────────────────

export async function getProjectPacket(orgId: string, projectId: string): Promise<AdvancePacket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_packets")
    .select("*")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdvancePacket) ?? null;
}

export async function getPacket(orgId: string, packetId: string): Promise<AdvancePacket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_packets")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", packetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdvancePacket) ?? null;
}

export async function listPacketSections(packetId: string): Promise<AdvancePacketSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_packet_sections")
    .select("*")
    .eq("packet_id", packetId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as AdvancePacketSection[];
}

export async function listPacketAudiences(packetId: string): Promise<AdvanceAudience[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_audiences")
    .select("*")
    .eq("packet_id", packetId)
    .is("deleted_at", null)
    .order("company", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as AdvanceAudience[];
}

export async function listSectionAssignments(audienceIds: string[]): Promise<AdvanceSectionAssignment[]> {
  if (audienceIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_section_assignments")
    .select("*")
    .in("audience_id", audienceIds)
    .is("deleted_at", null)
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as unknown as AdvanceSectionAssignment[];
}

export async function listPacketBatches(orgId: string, packetId?: string): Promise<AdvanceSendBatch[]> {
  const supabase = await createClient();
  let query = supabase
    .from("advance_send_batches")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (packetId) query = query.eq("packet_id", packetId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdvanceSendBatch[];
}

export async function getBatch(orgId: string, batchId: string): Promise<AdvanceSendBatch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_send_batches")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", batchId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdvanceSendBatch) ?? null;
}

export async function listBatchRecipients(batchId: string): Promise<AdvanceSendRecipient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_send_recipients")
    .select("*")
    .eq("batch_id", batchId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as AdvanceSendRecipient[];
}

export async function listRecipientSubmissions(recipientId: string): Promise<AdvanceSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advance_submissions")
    .select("*")
    .eq("recipient_id", recipientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as AdvanceSubmission[];
}

// ── Ledgered transitions ────────────────────────────────────────────────────
//
// Every state edge appends one `*_state_transitions` row (the
// onboarding_step_state_transitions pattern). Callers gate legality with
// the NEXT_* maps / canAdvanceDelivery BEFORE calling; these helpers guard
// with a conditional update so a concurrent transition no-ops instead of
// double-writing the ledger.

export async function setPacketState(
  packetId: string,
  from: AdvancePacketState,
  to: AdvancePacketState,
  userId?: string,
  reason?: string,
): Promise<boolean> {
  const supabase = await createClient();
  // soft-delete-exempt: state-guarded transition update returning org_id, not a read
  const { data, error } = await supabase
    .from("advance_packets")
    .update({ packet_state: to })
    .eq("id", packetId)
    .eq("packet_state", from)
    .select("org_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  await supabase.from("advance_packet_state_transitions").insert({
    org_id: (data as { org_id: string }).org_id,
    packet_id: packetId,
    from_state: from,
    to_state: to,
    transitioned_by: userId ?? null,
    reason: reason ?? null,
  });
  return true;
}

/**
 * Advance a recipient along the delivery funnel (forward-only; see
 * canAdvanceDelivery). Takes the Supabase client explicitly because the
 * funnel is written from two worlds: the studio console (RLS client) and
 * the token-authenticated portal (service-role client — recipients have
 * no session). No-ops on illegal or already-applied jumps.
 */
export async function applyRecipientDelivery(
  client: import("@/lib/supabase/loose").LooseSupabase,
  recipientId: string,
  to: AdvanceDeliveryState,
  opts: { userId?: string; reason?: string } = {},
): Promise<boolean> {
  const { data: current } = (await client
    .from("advance_send_recipients")
    .select("id, org_id, delivery_state")
    .eq("id", recipientId)
    .is("deleted_at", null)
    .maybeSingle()) as { data: { id: string; org_id: string; delivery_state: AdvanceDeliveryState } | null };
  if (!current || !canAdvanceDelivery(current.delivery_state, to)) return false;
  // soft-delete-exempt: state-guarded transition update returning id, not a read
  const { data: updated } = (await client
    .from("advance_send_recipients")
    .update({ delivery_state: to })
    .eq("id", recipientId)
    .eq("delivery_state", current.delivery_state)
    .select("id")) as { data: Array<{ id: string }> | null };
  if (!updated || updated.length === 0) return false;
  await client.from("advance_recipient_state_transitions").insert({
    org_id: current.org_id,
    recipient_id: recipientId,
    from_state: current.delivery_state,
    to_state: to,
    transitioned_by: opts.userId ?? null,
    reason: opts.reason ?? null,
  });
  return true;
}

export async function setBatchState(
  batchId: string,
  from: AdvanceBatchState,
  to: AdvanceBatchState,
  userId?: string,
  reason?: string,
): Promise<boolean> {
  const supabase = await createClient();
  const patch: { batch_state: AdvanceBatchState; sent_at?: string } = { batch_state: to };
  if (to === "sent") patch.sent_at = new Date().toISOString();
  // soft-delete-exempt: state-guarded transition update returning org_id, not a read
  const { data, error } = await supabase
    .from("advance_send_batches")
    .update(patch)
    .eq("id", batchId)
    .eq("batch_state", from)
    .select("org_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  await supabase.from("advance_send_batch_state_transitions").insert({
    org_id: (data as { org_id: string }).org_id,
    batch_id: batchId,
    from_state: from,
    to_state: to,
    transitioned_by: userId ?? null,
    reason: reason ?? null,
  });
  return true;
}
