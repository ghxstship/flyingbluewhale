import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { RosterLock } from "../roster/RosterLock";
import { resolveActiveProject } from "../roster/shared";
import { listAreaOptions } from "./areas";
import { addDaysToKey, zonedDayKey, zonedTimeToUtc } from "./tz";
import { SchedulerView, type SchedDay, type SchedSlot, type PoolMember } from "./SchedulerView";

export const dynamic = "force-dynamic";

/**
 * Kit 32 v2.9 · /m/scheduler — the Shift Scheduler field window
 * (More · Time & Work). Leads/managers build, assign and publish crew
 * shifts from the floor; the full scheduling engine stays in ATLVS.
 *
 * Gate: `schedule:write` (the kit's `assign` perm — the same rostering
 * capability the console shift writer checks). Members get the
 * capability-named lock screen, never a blank 403.
 *
 * Data model: one kit "shift" = a group of `shifts` seat rows sharing
 * role/area/times (see actions.ts). This page fetches the raw 7-day seat
 * window; the client groups, filters by day, and mutates through the
 * server actions.
 */

type ShiftRow = {
  id: string;
  role: string | null;
  starts_at: string;
  ends_at: string;
  publish_state: "draft" | "published";
  crew_member_id: string | null;
  checked_in_at: string | null;
  hourly_rate_cents: number | null;
  notes: string | null;
  venue_id: string | null;
  zone_id: string | null;
  zone: { name: string | null } | null;
  venue: { name: string | null } | null;
  crew: { name: string | null } | null;
};

export default async function SchedulerPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const eyebrowTail = t("m.scheduler.eyebrow", undefined, "Scheduling Engine In ATLVS");
  const title = t("m.scheduler.title", undefined, "Shift Scheduler");

  if (!can(session, "schedule:write")) {
    return (
      <RosterLock
        eyebrow={eyebrowTail}
        title={title}
        body={t("m.scheduler.lock.body", undefined, "Building and publishing shifts requires the capability")}
        capability="schedule:write"
        backHref="/m/more"
        backLabel={t("m.scheduler.lock.back", undefined, "Back To More")}
      />
    );
  }

  const fmt = await getRequestFormatters();
  const supabase = await createClient();

  // 7-day window in the REQUEST timezone — the same zone the formatters
  // render in, so the day a shift files under matches the time it displays.
  const tz = fmt.settings.timezone;
  const todayKey = zonedDayKey(new Date(), tz);
  const dayKeys = Array.from({ length: 7 }, (_, i) => addDaysToKey(todayKey, i));
  const from = zonedTimeToUtc(todayKey, "00:00", tz);
  const to = zonedTimeToUtc(addDaysToKey(todayKey, 7), "00:00", tz);
  const days: SchedDay[] = dayKeys.map((key) => ({
    key,
    // Noon anchor keeps the label on the right calendar day across DST edges.
    label: fmt.dateParts(zonedTimeToUtc(key, "12:00", tz), { weekday: "short", day: "numeric" }),
  }));

  const [project, areas, { data: shiftRows }, { data: crewRows }] = await Promise.all([
    resolveActiveProject(session.orgId),
    listAreaOptions(supabase, session.orgId),
    supabase
      .from("shifts")
      .select(
        "id, role, starts_at, ends_at, publish_state, crew_member_id, checked_in_at, hourly_rate_cents, notes, venue_id, zone_id, zone:zone_id(name), venue:venue_id(name), crew:crew_member_id(name)",
      )
      .eq("org_id", session.orgId)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at", { ascending: true })
      .limit(500),
    supabase
      .from("crew_members")
      .select("id, name, role")
      .eq("org_id", session.orgId)
      .neq("engagement_state", "separated")
      .order("name")
      .limit(300),
  ]);

  const hhmm = (iso: string) => fmt.dateParts(new Date(iso), { hour: "2-digit", minute: "2-digit", hour12: false });
  const areaTbd = t("m.scheduler.areaTbd", undefined, "Area TBD");

  const slots: SchedSlot[] = ((shiftRows ?? []) as unknown as ShiftRow[]).map((s) => {
    const zoneName = s.zone?.name ?? null;
    const venueName = s.venue?.name ?? null;
    return {
      id: s.id,
      dayKey: zonedDayKey(new Date(s.starts_at), tz),
      role: s.role ?? t("m.scheduler.untitledRole", undefined, "Crew"),
      area: zoneName && venueName ? `${zoneName} · ${venueName}` : (zoneName ?? venueName ?? areaTbd),
      start: hhmm(s.starts_at),
      end: hhmm(s.ends_at),
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      venueId: s.venue_id,
      zoneId: s.zone_id,
      crewId: s.crew_member_id,
      crewName: s.crew?.name ?? null,
      published: s.publish_state === "published",
      checkedIn: !!s.checked_in_at,
      rateCents: s.hourly_rate_cents,
      notes: s.notes,
    };
  });

  const pool: PoolMember[] = ((crewRows ?? []) as { id: string; name: string; role: string | null }[]).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
  }));

  return (
    <SchedulerView
      eyebrow={project ? `${project.name} · ${eyebrowTail}` : eyebrowTail}
      days={days}
      slots={slots}
      pool={pool}
      areaOptions={areas.map((a) => a.label)}
    />
  );
}
