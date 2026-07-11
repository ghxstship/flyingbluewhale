import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { emitDomainEvent } from "./dispatch";
import { log } from "@/lib/log";
import { urlFor } from "@/lib/urls";
import { formatDateParts } from "@/lib/i18n/format";
import {
  advanceReminderEmail,
  advanceLapseEmail,
  advanceAllocationEmail,
  type AdvanceChecklistLine,
} from "@/components/email/templates";
import type { AdvanceContact, AdvanceDeadlineKind } from "@/lib/db/advance-packets";

/**
 * Advance deadline ladder (kit 27, plan S7/S8) — the chase is automatic.
 *
 * `advance_deadline_events` is the materialized reminder schedule (T-5,
 * T-2, lapse, allocation confirm), written when a packet goes live. This
 * evaluator runs on the same worker tick as `evaluateSchedules`: it claims
 * due rows, renders the outstanding-sections email per pending recipient,
 * and emits one `advance.deadline.*` domain event per recipient — the
 * seeded chase automations (email.send + advance.escalate) do the sending,
 * so the ladder stays visible and editable in the Automation Studio.
 */

export const ADVANCE_EVENT_TYPE: Record<AdvanceDeadlineKind, string> = {
  t5_reminder: "advance.deadline.t5",
  t2_reminder: "advance.deadline.t2",
  lapse: "advance.deadline.lapsed",
  allocation_confirm: "advance.allocation.confirm_t2",
};

const PENDING_DELIVERY_STATES = ["queued", "delivered", "opened", "started"];

type DueEvent = {
  id: string;
  org_id: string;
  packet_id: string;
  audience_id: string | null;
  section_assignment_id: string | null;
  event_kind: AdvanceDeadlineKind;
  due_at: string;
};

function formatDeadline(iso: string): string {
  return formatDateParts(
    iso,
    { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" },
    { timezone: "UTC" },
  );
}

export async function evaluateAdvanceDeadlines(opts: { batchSize?: number } = {}): Promise<{
  processed: number;
  emitted: number;
}> {
  const svc = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;
  const batchSize = opts.batchSize ?? 50;

  const { data: rawDue, error } = (await svc
    .from("advance_deadline_events")
    .select("id, org_id, packet_id, audience_id, section_assignment_id, event_kind, due_at")
    .is("processed_at", null)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(batchSize)) as { data: DueEvent[] | null; error: { message: string } | null };
  if (error) throw new Error(`advance_deadline_events read failed: ${error.message}`);
  const due = rawDue ?? [];
  if (due.length === 0) return { processed: 0, emitted: 0 };

  let processed = 0;
  let emitted = 0;
  for (const ev of due) {
    // Claim first — a racing tick must not double-emit.
    const { data: claimed } = (await svc
      .from("advance_deadline_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", ev.id)
      .is("processed_at", null)
      .select("id")) as { data: Array<{ id: string }> | null };
    if (!claimed || claimed.length === 0) continue;
    processed += 1;

    try {
      emitted += await emitForEvent(svc, ev);
    } catch (err) {
      log.warn("advance_deadlines.emit_failed", {
        eventId: ev.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { processed, emitted };
}

async function emitForEvent(
  svc: import("@/lib/supabase/loose").LooseSupabase,
  ev: DueEvent,
): Promise<number> {
  const { data: packet } = (await svc
    .from("advance_packets")
    .select("id, org_id, project_id, voice, support_contact, created_by, projects(name, slug)")
    .eq("id", ev.packet_id)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data:
      | {
          id: string;
          org_id: string;
          project_id: string;
          voice: string;
          support_contact: Record<string, unknown>;
          created_by: string | null;
          projects: { name: string; slug: string } | null;
        }
      | null;
  };
  if (!packet || !ev.audience_id) return 0;

  const { data: audience } = (await svc
    .from("advance_audiences")
    .select("id, company, team, contract_id, contacts")
    .eq("id", ev.audience_id)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data: { id: string; company: string; team: string | null; contract_id: string | null; contacts: AdvanceContact[] } | null;
  };
  if (!audience) return 0;

  const projectName = packet.projects?.name ?? "Project";
  const projectCode = projectName.replace(/\s+/g, "");
  const slug = packet.projects?.slug ?? "";

  // Pending recipients for this audience (any batch of this packet).
  const { data: rawRecipients } = (await svc
    .from("advance_send_recipients")
    .select("id, contact, delivery_state, portal_token, batch_id, advance_send_batches!inner(packet_id)")
    .eq("audience_id", audience.id)
    .eq("advance_send_batches.packet_id", packet.id)
    .in("delivery_state", PENDING_DELIVERY_STATES)
    .is("deleted_at", null)
    .limit(200)) as {
    data: Array<{ id: string; contact: AdvanceContact; delivery_state: string; portal_token: string; batch_id: string }> | null;
  };
  const recipients = rawRecipients ?? [];
  if (recipients.length === 0) return 0;

  // Outstanding required sections for the audience: assignments minus
  // accepted/submitted submissions (computed per recipient below).
  const { data: rawAssignments } = (await svc
    .from("advance_section_assignments")
    .select("id, section_id, requirement, due_at, advance_packet_sections(title)")
    .eq("audience_id", audience.id)
    .neq("requirement", "hidden")
    .is("deleted_at", null)
    .limit(100)) as {
    data:
      | Array<{
          id: string;
          section_id: string;
          requirement: "required" | "optional" | "hidden";
          due_at: string | null;
          advance_packet_sections: { title: string } | null;
        }>
      | null;
  };
  const assignments = rawAssignments ?? [];

  let emitted = 0;
  for (const recipient of recipients) {
    const { data: rawSubmissions } = (await svc
      .from("advance_submissions")
      .select("section_id, submission_state")
      .eq("recipient_id", recipient.id)
      .in("submission_state", ["submitted", "accepted"])
      .is("deleted_at", null)
      .limit(200)) as { data: Array<{ section_id: string }> | null };
    const doneSections = new Set((rawSubmissions ?? []).map((s) => s.section_id));
    const outstanding: AdvanceChecklistLine[] = assignments
      .filter((a) => !doneSections.has(a.section_id))
      .map((a) => ({
        label: a.advance_packet_sections?.title ?? "Section",
        requirement: a.requirement === "required" ? "required" : "optional",
        dueLabel: a.due_at ? formatDeadline(a.due_at) : undefined,
      }));

    const portalUrl = urlFor("portal", `/${slug}/advancing?t=${recipient.portal_token}`);
    const deadlineLabel = formatDeadline(ev.due_at);
    const common = {
      recipientName: recipient.contact?.name,
      projectCode,
      projectName,
      team: audience.team,
      company: audience.company,
      voice: packet.voice,
      portalUrl,
    };

    let rendered: { subject: string; html: string } | null = null;
    if (ev.event_kind === "t5_reminder" || ev.event_kind === "t2_reminder") {
      if (outstanding.length === 0) continue; // fully submitted — no chase
      rendered = advanceReminderEmail({
        ...common,
        variant: ev.event_kind === "t5_reminder" ? "t5" : "t2",
        outstanding,
        deadlineLabel,
      });
    } else if (ev.event_kind === "lapse") {
      if (outstanding.length === 0) continue;
      rendered = advanceLapseEmail({ ...common, audience: "recipient", outstanding });
    } else {
      rendered = advanceAllocationEmail({ ...common, arrivalLabel: deadlineLabel });
    }

    const email = recipient.contact?.email;
    if (!rendered || !email) continue;

    await emitDomainEvent({
      orgId: packet.org_id,
      eventType: ADVANCE_EVENT_TYPE[ev.event_kind],
      sourceTable: "advance_packets",
      sourceId: packet.id,
      payload: {
        kind: ev.event_kind,
        packet_id: packet.id,
        audience_id: audience.id,
        recipient_id: recipient.id,
        batch_id: recipient.batch_id,
        company: audience.company,
        team: audience.team,
        owner_id: packet.created_by,
        project_name: projectName,
        email_to: email,
        email_subject: rendered.subject,
        email_html: rendered.html,
      },
    });
    emitted += 1;
  }
  return emitted;
}

/**
 * Seed the default chase ladder when a packet goes live (idempotent by
 * automation name). Four enabled event automations, packet-scoped via the
 * subscription's source_id, each sending the pre-rendered email from the
 * trigger payload; the lapse rung also escalates to the packet owner.
 *
 * `client` lets the go-live server action pass its RLS session client
 * (manager+ write policies cover automations + subscriptions), so seeding
 * works on targets without a service-role key; headless callers omit it
 * and get the service client.
 */
export async function seedAdvanceChaseAutomations(opts: {
  orgId: string;
  packetId: string;
  packetLabel: string;
  userId?: string;
  client?: import("@/lib/supabase/loose").LooseSupabase;
}): Promise<void> {
  const svc = opts.client ?? (createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase);

  const emailStep = {
    type: "email.send",
    input: {
      to: "{{trigger.data.email_to}}",
      subject: "{{trigger.data.email_subject}}",
      body: "{{trigger.data.email_html}}",
    },
  };

  const ladder: Array<{ name: string; eventType: string; steps: unknown[] }> = [
    { name: `Advance Chase · T-5 · ${opts.packetLabel}`, eventType: "advance.deadline.t5", steps: [emailStep] },
    { name: `Advance Chase · T-2 · ${opts.packetLabel}`, eventType: "advance.deadline.t2", steps: [emailStep] },
    {
      name: `Advance Chase · Lapse · ${opts.packetLabel}`,
      eventType: "advance.deadline.lapsed",
      steps: [emailStep, { type: "advance.escalate", input: { recipientId: "{{trigger.data.recipient_id}}", reason: "Advance lapsed" } }],
    },
    {
      name: `Advance Confirm · T-2 Arrival · ${opts.packetLabel}`,
      eventType: "advance.allocation.confirm_t2",
      steps: [emailStep],
    },
  ];

  for (const rung of ladder) {
    const { data: existing } = (await svc
      .from("automations")
      .select("id")
      .eq("org_id", opts.orgId)
      .eq("name", rung.name)
      .maybeSingle()) as { data: { id: string } | null };
    if (existing) continue;

    const { data: created, error } = (await svc
      .from("automations")
      .insert({
        org_id: opts.orgId,
        name: rung.name,
        description: "Seeded by the advance merge engine when the packet went live. Edit or disable freely.",
        trigger_kind: "event",
        trigger_config: { event_type: rung.eventType, packet_id: opts.packetId },
        steps: rung.steps,
        enabled: true,
        created_by: opts.userId ?? null,
      })
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    if (error || !created) {
      log.warn("advance_deadlines.seed_failed", { rung: rung.name, err: error?.message });
      continue;
    }
    // Same upsert as subscribeAutomationToEvent, on the caller's client so
    // RLS-session seeding works without a service key.
    const { error: subError } = (await svc.from("automation_subscriptions").upsert(
      {
        org_id: opts.orgId,
        automation_id: created.id,
        event_type: rung.eventType,
        source_table: "advance_packets",
        source_id: opts.packetId,
        enabled: true,
      },
      { onConflict: "automation_id,event_type,source_table,source_id" },
    )) as { error: { message: string } | null };
    if (subError) log.warn("advance_deadlines.subscribe_failed", { rung: rung.name, err: subError.message });
  }
}

/**
 * Materialize the reminder schedule for a packet's dated section
 * assignments: T-5 and T-2 reminders, the lapse mark at the deadline, and
 * the T-2 allocation confirmation (anchored to the section deadline until
 * a per-team arrival date exists on the audience model). Idempotent: rows
 * are only inserted for (assignment × kind) pairs not already present.
 */
export async function materializeDeadlineEvents(opts: {
  orgId: string;
  packetId: string;
  client?: import("@/lib/supabase/loose").LooseSupabase;
}): Promise<number> {
  const svc = opts.client ?? (createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase);

  const { data: rawAudiences } = (await svc
    .from("advance_audiences")
    .select("id")
    .eq("packet_id", opts.packetId)
    .is("deleted_at", null)
    .limit(500)) as { data: Array<{ id: string }> | null };
  const audienceIds = (rawAudiences ?? []).map((a) => a.id);
  if (audienceIds.length === 0) return 0;

  const { data: rawAssignments } = (await svc
    .from("advance_section_assignments")
    .select("id, audience_id, due_at")
    .in("audience_id", audienceIds)
    .not("due_at", "is", null)
    .is("deleted_at", null)
    .limit(2000)) as { data: Array<{ id: string; audience_id: string; due_at: string }> | null };
  const assignments = rawAssignments ?? [];
  if (assignments.length === 0) return 0;

  const { data: rawExisting } = (await svc
    .from("advance_deadline_events")
    .select("section_assignment_id, event_kind")
    .eq("packet_id", opts.packetId)
    .limit(5000)) as { data: Array<{ section_assignment_id: string | null; event_kind: string }> | null };
  const existing = new Set((rawExisting ?? []).map((e) => `${e.section_assignment_id}:${e.event_kind}`));

  const DAY = 86400000;
  const rows: Array<Record<string, unknown>> = [];
  for (const a of assignments) {
    const dueMs = Date.parse(a.due_at);
    const plan: Array<{ kind: AdvanceDeadlineKind; at: number }> = [
      { kind: "t5_reminder", at: dueMs - 5 * DAY },
      { kind: "t2_reminder", at: dueMs - 2 * DAY },
      { kind: "lapse", at: dueMs },
      { kind: "allocation_confirm", at: dueMs - 2 * DAY },
    ];
    for (const p of plan) {
      if (existing.has(`${a.id}:${p.kind}`)) continue;
      rows.push({
        org_id: opts.orgId,
        packet_id: opts.packetId,
        audience_id: a.audience_id,
        section_assignment_id: a.id,
        event_kind: p.kind,
        due_at: new Date(p.at).toISOString(),
      });
    }
  }
  if (rows.length === 0) return 0;
  const { error } = (await svc.from("advance_deadline_events").insert(rows)) as { error: { message: string } | null };
  if (error) throw new Error(`advance_deadline_events insert failed: ${error.message}`);
  return rows.length;
}
