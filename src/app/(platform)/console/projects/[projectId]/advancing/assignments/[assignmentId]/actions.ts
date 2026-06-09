"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";

async function guardAssignment(projectId: string, assignmentId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("id, catalog_kind, title, party_kind, party_user_id, fulfillment_state")
    .eq("id", assignmentId)
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as {
    id: string;
    catalog_kind: string;
    title: string | null;
    party_kind: "user" | "crew_member" | "external_holder";
    party_user_id: string | null;
    fulfillment_state: FulfillmentState;
  } | null;
}

const AdvanceSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  next_state: z.enum(FULFILLMENT_STATES),
});

export async function advanceState(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AdvanceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const a = await guardAssignment(parsed.data.projectId, parsed.data.assignmentId, session.orgId);
  if (!a) return;

  // Refuse illegal transitions server-side.
  if (!NEXT_FULFILLMENT_STATES[a.fulfillment_state]?.includes(parsed.data.next_state as FulfillmentState)) return;

  const supabase = await createClient();
  const { data: updated, error: updateErr } = await supabase
    .from("assignments")
    .update({ fulfillment_state: parsed.data.next_state })
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .eq("fulfillment_state", a.fulfillment_state)
    .select("id, fulfillment_state")
    .maybeSingle();
  if (updateErr) throw new Error(`Could not advance assignment state: ${updateErr.message}`);
  if (!updated) return;

  // Append to the universal event journal.
  const { error: eventErr } = await supabase.from("assignment_events").insert({
    assignment_id: parsed.data.assignmentId,
    org_id: session.orgId,
    event_kind: "state_change",
    actor_user_id: session.userId,
    from_state: a.fulfillment_state,
    to_state: parsed.data.next_state,
  });
  if (eventErr) throw new Error(`Could not record state change event: ${eventErr.message}`);

  // Notify the assignee (user kind only — external holders aren't on the platform).
  if (a.party_kind === "user" && a.party_user_id) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment_state",
      sourceType: "assignments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: `Assignment ${toTitle(parsed.data.next_state)}`,
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments`);
}

const ReassignSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  party_user_id: z.string().uuid(),
});

export async function reassignAssignment(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ReassignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const a = await guardAssignment(parsed.data.projectId, parsed.data.assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.party_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;
  if (parsed.data.party_user_id === a.party_user_id) return;

  const { error: reassignErr } = await supabase
    .from("assignments")
    .update({
      party_kind: "user",
      party_user_id: parsed.data.party_user_id,
      party_crew_id: null,
      party_external_id: null,
    })
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId);
  if (reassignErr) throw new Error(`Could not reassign assignment: ${reassignErr.message}`);

  void writeInbox({
    userId: parsed.data.party_user_id,
    orgId: session.orgId,
    kind: "assignment",
    sourceType: "assignment_reassignments",
    sourceId: crypto.randomUUID(),
    actorId: session.userId,
    title: "Assignment reassigned to you",
    body: a.title ?? "",
    href: "/m/advances",
  });

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments`);
}

const CommentSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function postComment(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = CommentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const a = await guardAssignment(parsed.data.projectId, parsed.data.assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  const { error: commentErr } = await supabase.from("assignment_events").insert({
    assignment_id: parsed.data.assignmentId,
    org_id: session.orgId,
    event_kind: "comment",
    actor_user_id: session.userId,
    body: parsed.data.body,
  });
  if (commentErr) throw new Error(`Could not post comment: ${commentErr.message}`);

  if (a.party_kind === "user" && a.party_user_id && a.party_user_id !== session.userId) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment",
      sourceType: "assignment_comments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: "New comment on your assignment",
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

// Per-kind detail upserts. Each catalog_kind has a sibling
// *_assignment_details table keyed by assignment_id (1:1). The R32
// migrations created the tables but left them unwritten — an admin
// could mark an assignment kind=lodging without ever recording the
// room number, leaving the field surface unable to render anything
// useful at /m. These actions fill that gap.

function emptyToNull<T extends string | undefined>(v: T): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function verifyAssignmentKind(
  projectId: string,
  assignmentId: string,
  orgId: string,
  expectedKind: string,
): Promise<{ id: string } | null> {
  const a = await guardAssignment(projectId, assignmentId, orgId);
  if (!a || a.catalog_kind !== expectedKind) return null;
  return { id: a.id };
}

// ── ticket ──────────────────────────────────────────────────────────────
const TicketDetailsSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  tier_code: z.string().trim().max(80).optional().or(z.literal("")),
  zone_codes: z.string().trim().max(500).optional().or(z.literal("")),
  gate_codes: z.string().trim().max(500).optional().or(z.literal("")),
  transferable: z.coerce.boolean().optional(),
  valid_from: z.string().trim().optional().or(z.literal("")),
  valid_until: z.string().trim().optional().or(z.literal("")),
  seat_section: z.string().trim().max(40).optional().or(z.literal("")),
  seat_row: z.string().trim().max(20).optional().or(z.literal("")),
  seat_number: z.string().trim().max(20).optional().or(z.literal("")),
});

function splitCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export async function upsertTicketDetails(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = TicketDetailsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const ok = await verifyAssignmentKind(parsed.data.projectId, parsed.data.assignmentId, session.orgId, "ticket");
  if (!ok) return;

  const supabase = await createClient();
  const { error: ticketErr } = await supabase.from("ticket_assignment_details").upsert(
    {
      assignment_id: parsed.data.assignmentId,
      tier_code: emptyToNull(parsed.data.tier_code),
      zone_codes: splitCsv(parsed.data.zone_codes),
      gate_codes: splitCsv(parsed.data.gate_codes),
      transferable: parsed.data.transferable ?? false,
      valid_from: emptyToNull(parsed.data.valid_from),
      valid_until: emptyToNull(parsed.data.valid_until),
      seat_section: emptyToNull(parsed.data.seat_section),
      seat_row: emptyToNull(parsed.data.seat_row),
      seat_number: emptyToNull(parsed.data.seat_number),
    },
    { onConflict: "assignment_id" },
  );
  if (ticketErr) throw new Error(`Could not save ticket details: ${ticketErr.message}`);

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

// ── credential ──────────────────────────────────────────────────────────
const CredentialDetailsSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  access_level: z.string().trim().max(80).optional().or(z.literal("")),
  parent_assignment_id: z.string().trim().optional().or(z.literal("")),
  issued_on: z.string().trim().optional().or(z.literal("")),
  expires_on: z.string().trim().optional().or(z.literal("")),
  must_return: z.coerce.boolean().optional(),
});

export async function upsertCredentialDetails(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = CredentialDetailsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const ok = await verifyAssignmentKind(parsed.data.projectId, parsed.data.assignmentId, session.orgId, "credential");
  if (!ok) return;

  const parent = emptyToNull(parsed.data.parent_assignment_id);
  // Self-reference would create a cycle — refuse outright. Cross-tenant
  // parent FK is gated by RLS but pre-check would be cheap too; we rely
  // on the FK + CASCADE/SET-NULL semantics for now.
  if (parent === parsed.data.assignmentId) return;

  const supabase = await createClient();
  const { error: credentialErr } = await supabase.from("credential_assignment_details").upsert(
    {
      assignment_id: parsed.data.assignmentId,
      access_level: emptyToNull(parsed.data.access_level),
      parent_assignment_id: parent,
      issued_on: emptyToNull(parsed.data.issued_on),
      expires_on: emptyToNull(parsed.data.expires_on),
      must_return: parsed.data.must_return ?? false,
    },
    { onConflict: "assignment_id" },
  );
  if (credentialErr) throw new Error(`Could not save credential details: ${credentialErr.message}`);

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

// ── lodging ─────────────────────────────────────────────────────────────
const LodgingDetailsSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  property_name: z.string().trim().max(200).optional().or(z.literal("")),
  room_number: z.string().trim().max(40).optional().or(z.literal("")),
  check_in: z.string().trim().optional().or(z.literal("")),
  check_out: z.string().trim().optional().or(z.literal("")),
  roommate_assignment_id: z.string().trim().optional().or(z.literal("")),
  confirmation_code: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function upsertLodgingDetails(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = LodgingDetailsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const ok = await verifyAssignmentKind(parsed.data.projectId, parsed.data.assignmentId, session.orgId, "lodging");
  if (!ok) return;

  const roommate = emptyToNull(parsed.data.roommate_assignment_id);
  if (roommate === parsed.data.assignmentId) return; // self-room would be nonsense

  const supabase = await createClient();
  const { error: lodgingErr } = await supabase.from("lodging_assignment_details").upsert(
    {
      assignment_id: parsed.data.assignmentId,
      property_name: emptyToNull(parsed.data.property_name),
      room_number: emptyToNull(parsed.data.room_number),
      check_in: emptyToNull(parsed.data.check_in),
      check_out: emptyToNull(parsed.data.check_out),
      roommate_assignment_id: roommate,
      confirmation_code: emptyToNull(parsed.data.confirmation_code),
    },
    { onConflict: "assignment_id" },
  );
  if (lodgingErr) throw new Error(`Could not save lodging details: ${lodgingErr.message}`);

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

// ── travel ──────────────────────────────────────────────────────────────
const TravelDetailsSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  mode: z.enum(["flight", "ground", "rail", "sea", ""]).optional(),
  from_location: z.string().trim().max(120).optional().or(z.literal("")),
  to_location: z.string().trim().max(120).optional().or(z.literal("")),
  depart_at: z.string().trim().optional().or(z.literal("")),
  arrive_at: z.string().trim().optional().or(z.literal("")),
  carrier: z.string().trim().max(120).optional().or(z.literal("")),
  confirmation_code: z.string().trim().max(120).optional().or(z.literal("")),
  seat: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function upsertTravelDetails(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = TravelDetailsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const ok = await verifyAssignmentKind(parsed.data.projectId, parsed.data.assignmentId, session.orgId, "travel");
  if (!ok) return;

  const supabase = await createClient();
  const { error: travelErr } = await supabase.from("travel_assignment_details").upsert(
    {
      assignment_id: parsed.data.assignmentId,
      mode: parsed.data.mode ? parsed.data.mode : null,
      from_location: emptyToNull(parsed.data.from_location),
      to_location: emptyToNull(parsed.data.to_location),
      depart_at: emptyToNull(parsed.data.depart_at),
      arrive_at: emptyToNull(parsed.data.arrive_at),
      carrier: emptyToNull(parsed.data.carrier),
      confirmation_code: emptyToNull(parsed.data.confirmation_code),
      seat: emptyToNull(parsed.data.seat),
    },
    { onConflict: "assignment_id" },
  );
  if (travelErr) throw new Error(`Could not save travel details: ${travelErr.message}`);

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

// ── vehicle ─────────────────────────────────────────────────────────────
const VehicleDetailsSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  vehicle_label: z.string().trim().max(120).optional().or(z.literal("")),
  plate: z.string().trim().max(40).optional().or(z.literal("")),
  picked_up_at: z.string().trim().optional().or(z.literal("")),
  returned_at: z.string().trim().optional().or(z.literal("")),
  mileage_start: z.coerce.number().int().min(0).max(10_000_000).optional(),
  mileage_end: z.coerce.number().int().min(0).max(10_000_000).optional(),
});

export async function upsertVehicleDetails(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const raw = Object.fromEntries(fd);
  // Empty number inputs come through as "", which coerce.number()
  // would turn into NaN. Strip them before validation.
  if (raw.mileage_start === "") delete raw.mileage_start;
  if (raw.mileage_end === "") delete raw.mileage_end;
  const parsed = VehicleDetailsSchema.safeParse(raw);
  if (!parsed.success) return;
  const ok = await verifyAssignmentKind(parsed.data.projectId, parsed.data.assignmentId, session.orgId, "vehicle");
  if (!ok) return;

  // mileage_end can't precede mileage_start — common data-entry error.
  if (
    parsed.data.mileage_start != null &&
    parsed.data.mileage_end != null &&
    parsed.data.mileage_end < parsed.data.mileage_start
  ) {
    return;
  }

  const supabase = await createClient();
  const { error: vehicleErr } = await supabase.from("vehicle_assignment_details").upsert(
    {
      assignment_id: parsed.data.assignmentId,
      vehicle_label: emptyToNull(parsed.data.vehicle_label),
      plate: emptyToNull(parsed.data.plate),
      picked_up_at: emptyToNull(parsed.data.picked_up_at),
      returned_at: emptyToNull(parsed.data.returned_at),
      mileage_start: parsed.data.mileage_start ?? null,
      mileage_end: parsed.data.mileage_end ?? null,
    },
    { onConflict: "assignment_id" },
  );
  if (vehicleErr) throw new Error(`Could not save vehicle details: ${vehicleErr.message}`);

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

export async function deleteAssignment(projectId: string, assignmentId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const a = await guardAssignment(projectId, assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  const { error: deleteErr } = await supabase
    .from("assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("org_id", session.orgId);
  if (deleteErr) throw new Error(`Could not delete assignment: ${deleteErr.message}`);

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
