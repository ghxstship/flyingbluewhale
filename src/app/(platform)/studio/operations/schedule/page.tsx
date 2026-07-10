import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { scheduleKindLabel } from "@/lib/schedule/kinds";
import { evaluateGuardrails, type ScheduleActivityInput } from "@/lib/schedule/guardrails";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { ScheduleComposer } from "./ScheduleComposer";
import { ScheduleBlock } from "./ScheduleBlock";

export const dynamic = "force-dynamic";

/**
 * Unified Schedule (CP·3) — the writable operational timeline. Promotes the
 * read-only Dispatch Matrix into a superset that unions the `events` schedule
 * store (typed activities, with the polymorphic location_kind / resource_ref
 * facets) with the operational stores — shifts (crew), dispatch_runs (fleet),
 * reservations (spaces), tasks (due markers) — onto one hour grid, grouped by
 * lane kind. Guardrails flag credential / double-book / rest / weekly-hours
 * conflicts. `operations/dispatch` 301s here.
 */

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const;

type LaneKind = "venue" | "vehicle" | "vessel" | "hotel_block" | "warehouse" | "office" | "greenroom" | "unassigned";

const LANE_ORDER: LaneKind[] = [
  "venue",
  "greenroom",
  "office",
  "warehouse",
  "hotel_block",
  "vessel",
  "vehicle",
  "unassigned",
];

const LANE_KIND_LABEL: Record<LaneKind, string> = {
  venue: "venue",
  vehicle: "vehicle",
  vessel: "vessel",
  hotel_block: "hotel",
  warehouse: "warehouse",
  office: "office",
  greenroom: "greenroom",
  unassigned: "unassigned",
};

type Lane = { id: string; kind: LaneKind; label: string; hasCrew: boolean };

type Block = {
  laneId: string;
  startHour: number;
  endHour: number;
  label: string;
  href: string;
  activityKind: string;
  tone: "info" | "warning" | "success" | "muted" | "accent";
  conflicted?: boolean;
  /** Set on `events`-sourced blocks — they are draggable + writable. */
  eventId?: string;
  startIso?: string;
  endIso?: string;
};

function asHour(iso: string, base: Date): number {
  const at = new Date(iso);
  const baseStart = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  return (at.getTime() - baseStart) / 3_600_000;
}

function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
  return { start, end };
}

function csv(v: string | undefined): Set<string> | null {
  if (!v) return null;
  const set = new Set(
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return set.size ? set : null;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    day?: string;
    lane?: string;
    kind?: string;
    state?: string;
    group?: string;
  }>;
}) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  const today = new Date();
  const dateStr = sp.day ?? sp.date ?? today.toISOString().slice(0, 10);
  const focus = new Date(`${dateStr}T00:00:00`);
  const laneFilter = csv(sp.lane);
  const kindFilter = csv(sp.kind);
  const stateFilter = csv(sp.state);

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.schedule.opsTitle", undefined, "Schedule")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.common.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { start, end } = dayBounds(focus);

  const [
    { data: venues },
    { data: crew },
    { data: projects },
    { data: events },
    { data: shifts },
    { data: tasks },
    { data: runs },
    { data: reservations },
    { data: maintenance },
  ] = await Promise.all([
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("crew_members").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
    supabase
      .from("events")
      .select("id, name, starts_at, ends_at, event_kind, event_state, location_kind, location_id, resource_ref")
      .eq("org_id", session.orgId)
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true }),
    supabase
      .from("shifts")
      .select("id, starts_at, ends_at, role, venue_id, workforce_member_id")
      .eq("org_id", session.orgId)
      .gte("starts_at", start)
      .lt("starts_at", end),
    supabase
      .from("tasks")
      .select("id, title, due_at, task_state")
      .eq("org_id", session.orgId)
      .gte("due_at", start)
      .lt("due_at", end),
    supabase
      .from("dispatch_runs")
      .select("id, fleet, vehicle_ref, scheduled_depart, scheduled_arrive")
      .eq("org_id", session.orgId)
      .gte("scheduled_depart", start)
      .lt("scheduled_depart", end),
    supabase
      .from("reservations")
      .select("id, guest_name, party_size, reserved_for, reservation_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("reserved_for", start)
      .lt("reserved_for", end),
    supabase
      .from("maintenance_jobs")
      .select("id, kind, target_kind, due_at")
      .eq("org_id", session.orgId)
      .is("completed_at", null)
      .gte("due_at", start)
      .lt("due_at", end),
  ]);

  const venueRows = (venues ?? []) as Array<{ id: string; name: string }>;
  const crewRows = (crew ?? []) as Array<{ id: string; name: string }>;
  const projectRows = (projects ?? []) as Array<{ id: string; name: string }>;
  const venueName = new Map(venueRows.map((v) => [v.id, v.name]));
  const crewName = new Map(crewRows.map((c) => [c.id, c.name]));

  const lanes = new Map<string, Lane>();
  const blocks: Block[] = [];
  const ensureLane = (id: string, kind: LaneKind, label: string, hasCrew = false) => {
    const existing = lanes.get(id);
    if (existing) {
      if (hasCrew) existing.hasCrew = true;
      return;
    }
    lanes.set(id, { id, kind, label, hasCrew });
  };

  const UNASSIGNED = "unassigned:general";

  // Guardrail context: every day event that binds a resource, so the digest can
  // flag double-book / rest conflicts. (Credential expiry is checked server-side
  // in the create/reschedule actions where the register is joined.)
  const eventRows = (events ?? []) as Array<{
    id: string;
    name: string;
    starts_at: string;
    ends_at: string;
    event_kind: string;
    event_state: string;
    location_kind: LaneKind | null;
    location_id: string | null;
    resource_ref: string | null;
  }>;
  const resourceActivities: ScheduleActivityInput[] = eventRows
    .filter((e) => e.resource_ref)
    .map((e) => ({
      id: e.id,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      resourceRef: e.resource_ref,
      locationId: e.location_id,
    }));
  const conflicted = new Set<string>();
  const digest: Array<{ label: string; message: string; level: "error" | "warn" }> = [];
  for (const a of resourceActivities) {
    const vs = evaluateGuardrails(a, resourceActivities, []);
    for (const v of vs) {
      conflicted.add(a.id);
      const who = a.resourceRef ? (crewName.get(a.resourceRef) ?? "Resource") : "Resource";
      digest.push({ label: who, message: v.message, level: v.level });
    }
  }

  // 1. events → typed activities on their lane.
  for (const e of eventRows) {
    if (stateFilter && !stateFilter.has(e.event_state)) continue;
    const laneKind: LaneKind = e.location_kind ?? (e.location_id ? "venue" : "unassigned");
    const laneId = e.location_id
      ? `${laneKind}:${e.location_id}`
      : e.resource_ref
        ? `${laneKind}:res:${e.resource_ref}`
        : UNASSIGNED;
    const label = e.location_id
      ? (venueName.get(e.location_id) ?? LANE_KIND_LABEL[laneKind])
      : e.resource_ref
        ? (crewName.get(e.resource_ref) ?? "Crew")
        : t("console.schedule.unassigned", undefined, "Unassigned");
    ensureLane(laneId, laneKind, label, Boolean(e.resource_ref));
    blocks.push({
      laneId,
      startHour: asHour(e.starts_at, focus),
      endHour: asHour(e.ends_at, focus),
      label: e.name,
      href: e.event_kind === "meeting" ? `/studio/meetings/${e.id}` : `/studio/events/${e.id}`,
      activityKind: e.event_kind,
      tone: "accent",
      conflicted: conflicted.has(e.id),
      eventId: e.id,
      startIso: e.starts_at,
      endIso: e.ends_at,
    });
  }

  // 2. shifts → crew activities on their venue lane.
  for (const s of (shifts ?? []) as Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    role: string | null;
    venue_id: string | null;
    workforce_member_id: string | null;
  }>) {
    const laneId = s.venue_id ? `venue:${s.venue_id}` : UNASSIGNED;
    const label = s.venue_id
      ? (venueName.get(s.venue_id) ?? LANE_KIND_LABEL.venue)
      : t("console.schedule.unassigned", undefined, "Unassigned");
    ensureLane(laneId, s.venue_id ? "venue" : "unassigned", label, Boolean(s.workforce_member_id));
    blocks.push({
      laneId,
      startHour: asHour(s.starts_at, focus),
      endHour: asHour(s.ends_at, focus),
      label: s.role ?? t("console.schedule.shift", undefined, "Shift"),
      href: `/studio/workforce/rosters`,
      activityKind: "shift",
      tone: "info",
    });
  }

  // 3. dispatch_runs → vehicle-lane activities.
  const runRows = (runs ?? []) as Array<{
    id: string;
    fleet: string | null;
    vehicle_ref: string | null;
    scheduled_depart: string;
    scheduled_arrive: string | null;
  }>;
  for (const r of runRows) {
    const key = r.vehicle_ref ?? r.fleet ?? "veh";
    const laneId = `vehicle:${key}`;
    ensureLane(laneId, "vehicle", key);
    const dep = asHour(r.scheduled_depart, focus);
    const arr = r.scheduled_arrive ? asHour(r.scheduled_arrive, focus) : dep + 0.5;
    blocks.push({
      laneId,
      startHour: dep,
      endHour: arr,
      label: r.vehicle_ref ?? r.fleet ?? t("console.schedule.run", undefined, "Run"),
      href: `/studio/transport/dispatch/${r.id}`,
      activityKind: "dispatch",
      tone: "success",
    });
  }

  // 4. reservations → space bookings on a Reservations lane.
  const RES_LANE = "venue:reservations";
  for (const rv of (reservations ?? []) as Array<{
    id: string;
    guest_name: string;
    party_size: number;
    reserved_for: string;
    reservation_state: string;
  }>) {
    ensureLane(RES_LANE, "venue", t("console.schedule.reservations", undefined, "Reservations"));
    const s = asHour(rv.reserved_for, focus);
    blocks.push({
      laneId: RES_LANE,
      startHour: s,
      endHour: s + 1.5,
      label: `${rv.guest_name} · ${rv.party_size}`,
      href: `/studio/operations/reservations`,
      activityKind: "reservation",
      tone: "muted",
    });
  }

  // 5. maintenance_jobs → asset service windows on a warehouse lane.
  const MAINT_LANE = "warehouse:maintenance";
  for (const m of (maintenance ?? []) as Array<{
    id: string;
    kind: string;
    target_kind: string;
    due_at: string;
  }>) {
    ensureLane(MAINT_LANE, "warehouse", t("console.schedule.maintenance", undefined, "Maintenance"));
    const s = asHour(m.due_at, focus);
    blocks.push({
      laneId: MAINT_LANE,
      startHour: s,
      endHour: s + 1,
      label: `${m.kind} · ${m.target_kind}`,
      href: `/studio/operations/maintenance/${m.id}`,
      activityKind: "maintenance",
      tone: "warning",
    });
  }

  // 6. tasks → due markers on the Unassigned lane.
  for (const task of (tasks ?? []) as Array<{ id: string; title: string; due_at: string; task_state: string }>) {
    ensureLane(UNASSIGNED, "unassigned", t("console.schedule.unassigned", undefined, "Unassigned"));
    const s = asHour(task.due_at, focus);
    blocks.push({
      laneId: UNASSIGNED,
      startHour: s - 0.25,
      endHour: s + 0.25,
      label: task.title,
      href: `/studio/tasks/${task.id}`,
      activityKind: "task",
      tone: task.task_state === "done" ? "muted" : "warning",
    });
  }

  // Apply the lane + kind filters (deep-links: ?lane=vehicle,crew&kind=shift…).
  let laneList = Array.from(lanes.values());
  if (laneFilter) {
    laneList = laneList.filter((l) => laneFilter.has(l.kind) || (laneFilter.has("crew") && l.hasCrew));
  }
  laneList.sort((a, b) => LANE_ORDER.indexOf(a.kind) - LANE_ORDER.indexOf(b.kind) || a.label.localeCompare(b.label));
  const keptLaneIds = new Set(laneList.map((l) => l.id));

  const byLane = new Map<string, Block[]>();
  let shown = 0;
  for (const b of blocks) {
    if (!keptLaneIds.has(b.laneId)) continue;
    if (kindFilter && !kindFilter.has(b.activityKind)) continue;
    const list = byLane.get(b.laneId) ?? [];
    list.push(b);
    byLane.set(b.laneId, list);
    shown++;
  }

  const prevDate = new Date(focus.getTime() - 86_400_000).toISOString().slice(0, 10);
  const nextDate = new Date(focus.getTime() + 86_400_000).toISOString().slice(0, 10);
  const totalHours = HOURS.length;
  const colWidth = 60;
  const laneHeight = 56;

  const toneClass: Record<Block["tone"], string> = {
    info: "bg-[var(--p-info)]",
    warning: "bg-[var(--p-warning)]",
    success: "bg-[var(--p-success)]",
    muted: "bg-[var(--p-text-3)]",
    accent: "bg-[var(--p-accent)]",
  };

  return (
    <>
      {/* B-19: live ops timeline — new/rescheduled activities appear without a
          manual reload on show day. Org-filtered so we only wake on our rows. */}
      <RealtimeRefresh
        table="events"
        filter={`org_id=eq.${session.orgId}`}
        channelName={`ops-schedule-events-${session.orgId}`}
      />
      <ModuleHeader
        eyebrow={t("console.operations.eyebrow", undefined, "Operations")}
        title={t("console.schedule.opsTitle", undefined, "Schedule")}
        subtitle={t(
          "console.schedule.opsSubtitle",
          { date: dateStr, blocks: shown, lanes: laneList.length },
          `${dateStr} · ${shown} activities across ${laneList.length} lanes`,
        )}
        action={
          <ScheduleComposer
            venues={venueRows.map((v) => ({ id: v.id, label: v.name }))}
            crew={crewRows.map((c) => ({ id: c.id, label: c.name }))}
            projects={projectRows.map((p) => ({ id: p.id, label: p.name }))}
            defaultDate={dateStr}
          />
        }
      />
      <div className="page-content space-y-4">
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={`/studio/operations/schedule?day=${prevDate}`} className="text-[var(--p-accent)] hover:underline">
            ← {prevDate}
          </Link>
          <span className="font-mono text-xs text-[var(--p-text-2)]">{dateStr}</span>
          <Link href={`/studio/operations/schedule?day=${nextDate}`} className="text-[var(--p-accent)] hover:underline">
            {nextDate} →
          </Link>
          <span className="ms-auto flex flex-wrap items-center gap-3 text-xs">
            {(
              [
                ["accent", t("console.schedule.legend.activity", undefined, "Activity")],
                ["info", t("console.schedule.legend.shift", undefined, "Shift")],
                ["success", t("console.schedule.legend.dispatch", undefined, "Dispatch")],
                ["muted", t("console.schedule.legend.reservation", undefined, "Reservation")],
                ["warning", t("console.schedule.legend.task", undefined, "Task")],
              ] as const
            ).map(([tone, label]) => (
              <span key={tone} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-sm ${toneClass[tone]}`} />
                {label}
              </span>
            ))}
          </span>
        </nav>

        {digest.length > 0 && (
          <div className="surface-inset rounded-[var(--p-r-lg)] p-3">
            <p className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.schedule.digestTitle", { n: digest.length }, `${digest.length} guardrail flags`)}
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {digest.slice(0, 6).map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge variant={d.level === "error" ? "error" : "warning"}>{d.level}</Badge>
                  <span className="font-medium">{d.label}</span>
                  <span className="text-[var(--p-text-2)]">{d.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="surface overflow-x-auto">
          <div className="sticky top-0 flex border-b border-[var(--p-border)] bg-[var(--p-surface)]">
            <div
              style={{ width: 180 }}
              className="shrink-0 border-e border-[var(--p-border)] px-3 py-2 text-[11px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase"
            >
              {t("console.schedule.laneColumn", undefined, "Lane")}
            </div>
            <div className="flex" style={{ width: colWidth * totalHours }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ width: colWidth }}
                  className="border-e border-[var(--p-border)] px-2 py-2 font-mono text-[11px] text-[var(--p-text-2)]"
                >
                  {h.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {laneList.length === 0 && (
            <div className="p-6 text-sm text-[var(--p-text-2)]">
              {t("console.schedule.empty", undefined, "No activities scheduled for this day.")}
            </div>
          )}

          {laneList.map((lane) => {
            const items = byLane.get(lane.id) ?? [];
            return (
              <div key={lane.id} className="flex border-b border-[var(--p-border)]">
                <div
                  style={{ width: 180, height: laneHeight }}
                  className="flex shrink-0 items-center border-e border-[var(--p-border)] px-3 text-xs"
                >
                  <Badge variant={lane.kind === "vehicle" ? "info" : "muted"} className="me-2">
                    {LANE_KIND_LABEL[lane.kind]}
                  </Badge>
                  <span className="truncate">{lane.label}</span>
                </div>
                <div className="relative" style={{ width: colWidth * totalHours, height: laneHeight }}>
                  {HOURS.map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-e border-[var(--p-border)] opacity-30"
                      style={{ left: idx * colWidth, width: colWidth }}
                    />
                  ))}
                  {items.map((b, i) => {
                    const startCol = Math.max(0, b.startHour - HOURS[0]);
                    const widthHrs = Math.max(0.25, b.endHour - b.startHour);
                    if (b.startHour > HOURS[HOURS.length - 1]! + 1) return null;
                    if (b.endHour < HOURS[0]) return null;
                    const leftPx = startCol * colWidth;
                    const widthPx = widthHrs * colWidth;
                    const typedLabel =
                      b.activityKind !== "shift" &&
                      b.activityKind !== "dispatch" &&
                      b.activityKind !== "task" &&
                      b.activityKind !== "reservation" &&
                      b.activityKind !== "maintenance"
                        ? scheduleKindLabel(b.activityKind)
                        : null;
                    // events-sourced blocks are draggable + writable.
                    if (b.eventId && b.startIso && b.endIso) {
                      return (
                        <ScheduleBlock
                          key={`${b.laneId}-${i}`}
                          eventId={b.eventId}
                          startIso={b.startIso}
                          endIso={b.endIso}
                          leftPx={leftPx}
                          widthPx={widthPx}
                          colWidth={colWidth}
                          label={b.label}
                          kindLabel={typedLabel}
                          toneClass={toneClass[b.tone]}
                          href={b.href}
                          conflicted={Boolean(b.conflicted)}
                        />
                      );
                    }
                    return (
                      <Link
                        key={`${b.laneId}-${i}`}
                        href={b.href}
                        className={`absolute top-1.5 bottom-1.5 overflow-hidden rounded border px-2 py-1 text-[11px] ${
                          b.conflicted
                            ? "border-[var(--p-danger)] bg-[var(--p-surface)]"
                            : "border-[var(--p-border)] bg-[var(--p-surface)]"
                        }`}
                        style={{ left: leftPx, width: widthPx }}
                        title={b.conflicted ? `${b.label} · guardrail conflict` : b.label}
                      >
                        <span className={`me-1 inline-block h-1.5 w-1.5 rounded-sm ${toneClass[b.tone]}`} />
                        <span className="font-medium">{b.label}</span>
                        {typedLabel && <span className="ms-1 text-[var(--p-text-3)]">{typedLabel}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
