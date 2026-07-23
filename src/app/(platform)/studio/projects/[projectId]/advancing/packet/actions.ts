"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import {
  ADVANCE_SECTION_KEYS,
  ADVANCE_SECTION_LABEL,
  ADVANCE_REQUIREMENTS,
  ADVANCE_VOICES,
  NEXT_PACKET_STATES,
  deriveContractId,
  type AdvancePacketState,
  type AdvanceSectionKey,
  type AdvanceContact,
} from "@/lib/db/advance-packets";
import { SUBMISSION_SCHEMA_KEYS } from "@/lib/advancing/submission-schemas";
import { materializeDeadlineEvents, seedAdvanceChaseAutomations } from "@/lib/automations/advance-deadlines";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

function packetPath(projectId: string): string {
  return `/studio/projects/${projectId}/advancing/packet`;
}

/** Sections a fresh packet starts with — the Mochakk body structure. */
const DEFAULT_SECTIONS: Array<{ key: AdvanceSectionKey; schema?: string; deliverables?: string[] }> = [
  { key: "overview" },
  { key: "schedule_milestones" },
  { key: "crew_list", schema: "crew_list" },
  { key: "production_advance", schema: "production_advance" },
  { key: "travel_lodging", schema: "travel" },
  { key: "safety" },
  { key: "parking_load_in" },
  { key: "tech", schema: "rider_upload", deliverables: ["technical_rider", "stage_plot", "input_list"] },
];

async function guardProject(projectId: string): Promise<{ orgId: string; userId: string } | { error: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.author-advance-packets", "Only manager+ can author advance packets") };
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  return { orgId: session.orgId, userId: session.userId };
}

export async function createPacketAction(projectId: string): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("advance_packets")
    .select("id")
    .eq("org_id", guard.orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return;

  // soft-delete-exempt: insert returning id, not a read
  const { data: packet, error } = await supabase
    .from("advance_packets")
    .insert({
      org_id: guard.orgId,
      project_id: projectId,
      created_by: guard.userId,
    } as never)
    .select("id")
    .single();
  if (error || !packet) return;

  await supabase.from("advance_packet_sections").insert(
    DEFAULT_SECTIONS.map((s, i) => ({
      org_id: guard.orgId,
      packet_id: packet.id,
      section_key: s.key,
      title: ADVANCE_SECTION_LABEL[s.key],
      sort_order: i,
      submission_schema_key: s.schema ?? null,
      deliverable_types: s.deliverables ?? [],
    })) as never,
  );
  revalidatePath(packetPath(projectId));
}

const VoiceSchema = z.object({
  packet_id: z.string().uuid(),
  voice: z.enum(ADVANCE_VOICES),
});

export async function setPacketVoiceAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const parsed = VoiceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("advance_packets")
    .update({ voice: parsed.data.voice })
    .eq("id", parsed.data.packet_id)
    .eq("org_id", guard.orgId);
  revalidatePath(packetPath(projectId));
}

const TransitionSchema = z.object({
  packet_id: z.string().uuid(),
  from: z.enum(["draft", "live", "archived"]),
  to: z.enum(["draft", "live", "archived"]),
});

export async function transitionPacketAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const parsed = TransitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const { packet_id, from, to } = parsed.data;
  if (!NEXT_PACKET_STATES[from as AdvancePacketState].includes(to as AdvancePacketState)) return;

  const supabase = await createClient();
  // soft-delete-exempt: state-guarded transition update returning the row, not a read
  const { data: updated } = await supabase
    .from("advance_packets")
    .update({ packet_state: to })
    .eq("id", packet_id)
    .eq("org_id", guard.orgId)
    .eq("packet_state", from)
    .select("id, projects(name)")
    .maybeSingle();
  if (!updated) return;
  await supabase.from("advance_packet_state_transitions").insert({
    org_id: guard.orgId,
    packet_id,
    from_state: from,
    to_state: to,
    transitioned_by: guard.userId,
  } as never);

  // Going live arms the machine: the reminder schedule is materialized and
  // the default chase ladder is seeded (idempotent) into Automation Studio.
  // Runs on the session's RLS client (manager+ write policies cover both
  // stores), so it works on targets without a service-role key.
  if (to === "live") {
    const label = (updated as unknown as { projects: { name: string } | null }).projects?.name ?? packet_id.slice(0, 8);
    const rlsClient = supabase as unknown as import("@/lib/supabase/loose").LooseSupabase;
    try {
      await materializeDeadlineEvents({ orgId: guard.orgId, packetId: packet_id, client: rlsClient });
      await seedAdvanceChaseAutomations({
        orgId: guard.orgId,
        packetId: packet_id,
        packetLabel: label,
        userId: guard.userId,
        client: rlsClient,
      });
    } catch {
      // Best-effort: the packet is live either way; the ladder can be
      // re-armed by cycling draft → live.
    }
  }
  revalidatePath(packetPath(projectId));
}

const SectionSchema = z.object({
  packet_id: z.string().uuid(),
  section_key: z.enum(ADVANCE_SECTION_KEYS),
  title: z.string().min(1).max(200),
  body_text: z.string().max(8000).optional(),
  submission_schema_key: z.string().optional(),
});

export async function addSectionAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return { error: guard.error };
  const parsed = SectionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const schemaKey = parsed.data.submission_schema_key || null;
  if (schemaKey && !SUBMISSION_SCHEMA_KEYS.includes(schemaKey as never)) {
    return { error: actionErrorMessage("unknown-submission-schema", "Unknown submission schema") };
  }
  const supabase = await createClient();
  const { count } = await supabase
    .from("advance_packet_sections")
    .select("id", { count: "exact", head: true })
    .eq("packet_id", parsed.data.packet_id)
    .is("deleted_at", null);
  const { error } = await supabase.from("advance_packet_sections").insert({
    org_id: guard.orgId,
    packet_id: parsed.data.packet_id,
    section_key: parsed.data.section_key,
    title: parsed.data.title,
    body: parsed.data.body_text ? { text: parsed.data.body_text } : {},
    sort_order: count ?? 0,
    submission_schema_key: schemaKey,
  } as never);
  if (error) return actionFail(error.message, fd);
  revalidatePath(packetPath(projectId));
  return { ok: true };
}

export async function deleteSectionAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const sectionId = String(fd.get("section_id") ?? "");
  if (!sectionId) return;
  const supabase = await createClient();
  await supabase
    .from("advance_packet_sections")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sectionId)
    .eq("org_id", guard.orgId);
  revalidatePath(packetPath(projectId));
}

const AudienceSchema = z.object({
  packet_id: z.string().uuid(),
  company: z.string().min(1).max(200),
  department: z.string().max(200).optional(),
  team: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  scope: z.string().max(200).optional(),
  external_scheduler_url: z.string().url().max(500).optional().or(z.literal("")),
  contacts: z.string().min(1).max(4000),
  preset_type: z.string().max(80).optional(),
});

/** Parse "Name <email>" / bare-email lines into contact objects. */
function parseContacts(raw: string): AdvanceContact[] {
  const out: AdvanceContact[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const bracketed = trimmed.match(/^(.*?)\s*<([^<>@\s]+@[^<>\s]+)>$/);
    if (bracketed?.[2]) {
      out.push({ name: bracketed[1]?.trim() || undefined, email: bracketed[2].toLowerCase() });
      continue;
    }
    if (/^[^<>@\s]+@[^<>\s]+$/.test(trimmed)) out.push({ email: trimmed.toLowerCase() });
  }
  return out;
}

export async function addAudienceAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return { error: guard.error };
  const parsed = AudienceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const contacts = parseContacts(parsed.data.contacts);
  if (contacts.length === 0) {
    return { error: actionErrorMessage("add-at-least-one-contact-one-per-line-name", "Add at least one contact, one per line: Name <email> or a bare email"), values: Object.fromEntries(fd) as Record<string, string> };
  }
  const supabase = await createClient();

  // Contract ID derives from the packet's job (requisition) — never typed.
  const { data: packet } = await supabase
    .from("advance_packets")
    .select("id, job_id")
    .eq("id", parsed.data.packet_id)
    .eq("org_id", guard.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!packet) return { error: actionErrorMessage("not-found.packet", "Packet not found") };

  // soft-delete-exempt: insert returning id, not a read
  const { data: audience, error } = await supabase
    .from("advance_audiences")
    .insert({
      org_id: guard.orgId,
      packet_id: parsed.data.packet_id,
      company: parsed.data.company,
      department: parsed.data.department || null,
      team: parsed.data.team || null,
      role: parsed.data.role || null,
      scope: parsed.data.scope || null,
      contract_id: deriveContractId(packet.job_id),
      external_scheduler_url: parsed.data.external_scheduler_url || null,
      contacts,
    } as never)
    .select("id")
    .single();
  if (error || !audience) return actionFail(error?.message ?? "Insert failed", fd);

  if (parsed.data.preset_type) {
    await applyPresets({
      orgId: guard.orgId,
      projectId,
      packetId: parsed.data.packet_id,
      audienceId: audience.id,
      audienceType: parsed.data.preset_type,
    });
  }
  revalidatePath(packetPath(projectId));
  return { ok: true };
}

export async function deleteAudienceAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const audienceId = String(fd.get("audience_id") ?? "");
  if (!audienceId) return;
  const supabase = await createClient();
  await supabase
    .from("advance_audiences")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", audienceId)
    .eq("org_id", guard.orgId);
  revalidatePath(packetPath(projectId));
}

/**
 * Seed section assignments from the preset matrices — project presets
 * override org presets per section (decision #4: every category is
 * assignable per audience, auto via presets or manual override).
 */
async function applyPresets(input: {
  orgId: string;
  projectId: string;
  packetId: string;
  audienceId: string;
  audienceType: string;
}): Promise<void> {
  const supabase = await createClient();
  const [{ data: orgPresets }, { data: projectPresets }, { data: sections }] = await Promise.all([
    supabase
      .from("org_advance_presets")
      .select("section_key, requirement, due_offset_days")
      .eq("org_id", input.orgId)
      .eq("audience_type", input.audienceType)
      .is("deleted_at", null),
    supabase
      .from("project_advance_presets")
      .select("section_key, requirement, due_offset_days")
      .eq("project_id", input.projectId)
      .eq("audience_type", input.audienceType)
      .is("deleted_at", null),
    supabase
      .from("advance_packet_sections")
      .select("id, section_key")
      .eq("packet_id", input.packetId)
      .is("deleted_at", null),
  ]);

  type PresetRow = { section_key: string; requirement: string; due_offset_days: number | null };
  const merged = new Map<string, { row: PresetRow; via: "org_preset" | "project_preset" }>();
  for (const p of (orgPresets ?? []) as PresetRow[]) merged.set(p.section_key, { row: p, via: "org_preset" });
  for (const p of (projectPresets ?? []) as PresetRow[]) merged.set(p.section_key, { row: p, via: "project_preset" });
  if (merged.size === 0) return;

  const sectionByKey = new Map(
    ((sections ?? []) as Array<{ id: string; section_key: string }>).map((s) => [s.section_key, s.id]),
  );
  const rows: Array<Record<string, unknown>> = [];
  for (const [key, preset] of merged) {
    const sectionId = sectionByKey.get(key);
    if (!sectionId) continue;
    rows.push({
      org_id: input.orgId,
      audience_id: input.audienceId,
      section_id: sectionId,
      requirement: preset.row.requirement,
      assigned_via: preset.via,
    });
  }
  if (rows.length > 0) await supabase.from("advance_section_assignments").insert(rows as never);
}

const AssignSchema = z.object({
  packet_id: z.string().uuid(),
  audience_id: z.string().uuid(),
  section_id: z.string().uuid(),
  requirement: z.enum(ADVANCE_REQUIREMENTS),
  due_at: z.string().optional(),
  assigned_via: z.enum(["manual", "contract_override"]).default("manual"),
});

export async function assignSectionAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const parsed = AssignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const dueAt = parsed.data.due_at ? new Date(parsed.data.due_at).toISOString() : null;
  const supabase = await createClient();

  // Manual update-or-insert: the pair uniqueness index is partial
  // (deleted_at is null), which PostgREST upsert can't infer against.
  const { data: existing } = await supabase
    .from("advance_section_assignments")
    .select("id")
    .eq("audience_id", parsed.data.audience_id)
    .eq("section_id", parsed.data.section_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("advance_section_assignments")
      .update({ requirement: parsed.data.requirement, due_at: dueAt, assigned_via: parsed.data.assigned_via })
      .eq("id", existing.id)
      .eq("org_id", guard.orgId);
  } else {
    await supabase.from("advance_section_assignments").insert({
      org_id: guard.orgId,
      audience_id: parsed.data.audience_id,
      section_id: parsed.data.section_id,
      requirement: parsed.data.requirement,
      due_at: dueAt,
      assigned_via: parsed.data.assigned_via,
    } as never);
  }
  revalidatePath(packetPath(projectId));
}

export async function removeAssignmentAction(projectId: string, fd: FormData): Promise<void> {
  const guard = await guardProject(projectId);
  if ("error" in guard) return;
  const assignmentId = String(fd.get("assignment_id") ?? "");
  if (!assignmentId) return;
  const supabase = await createClient();
  await supabase
    .from("advance_section_assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("org_id", guard.orgId);
  revalidatePath(packetPath(projectId));
}
