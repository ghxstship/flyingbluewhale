import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const;

type Lane = { id: string; kind: "venue"; label: string } | { id: string; kind: "vehicle"; label: string };

type Block = {
  laneId: string;
  startHour: number; // float
  endHour: number;
  label: string;
  href: string;
  source: "shift" | "task" | "dispatch";
  tone: "info" | "warning" | "success" | "muted";
};

function asHour(iso: string, base: Date): number {
  const at = new Date(iso);
  // Express the time as hours-from-midnight on `base`
  const baseStart = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  return (at.getTime() - baseStart) / 3_600_000;
}

function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
  return { start, end };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  const today = new Date();
  const dateStr = sp.date ?? today.toISOString().slice(0, 10);
  const focus = new Date(`${dateStr}T00:00:00`);

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.operations.dispatch.title", undefined, "Dispatch")} />
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

  const [{ data: venues }, { data: shifts }, { data: tasks }, { data: runs }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase
      .from("shifts")
      .select("id, starts_at, ends_at, role, venue_id, workforce_member_id")
      .eq("org_id", session.orgId)
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, due_at, task_state, project_id")
      .eq("org_id", session.orgId)
      .gte("due_at", start)
      .lt("due_at", end)
      .order("due_at", { ascending: true }),
    supabase
      .from("dispatch_runs")
      .select("id, fleet, vehicle_ref, run_state, scheduled_depart, scheduled_arrive")
      .eq("org_id", session.orgId)
      .gte("scheduled_depart", start)
      .lt("scheduled_depart", end)
      .order("scheduled_depart", { ascending: true }),
  ]);

  // Build lanes: every venue + an "Unassigned" lane + every vehicle that ran
  const venueRows = (venues ?? []) as Array<{ id: string; name: string }>;
  const venueLanes: Lane[] = venueRows.map((v) => ({ id: `venue:${v.id}`, kind: "venue", label: v.name }));
  venueLanes.push({
    id: "venue:unassigned",
    kind: "venue",
    label: t("console.operations.dispatch.unassigned", undefined, "Unassigned"),
  });

  type RunRow = {
    id: string;
    fleet: string | null;
    vehicle_ref: string | null;
    run_state: string | null;
    scheduled_depart: string;
    scheduled_arrive: string | null;
  };
  const runRows = (runs ?? []) as RunRow[];
  const vehicleKey = (r: RunRow) => r.vehicle_ref ?? r.fleet ?? "veh";
  const vehicles = Array.from(new Set(runRows.map(vehicleKey))).sort();
  const vehicleLanes: Lane[] = vehicles.map((v) => ({ id: `vehicle:${v}`, kind: "vehicle", label: v }));

  // Materialise blocks
  const blocks: Block[] = [];
  for (const s of (shifts ?? []) as Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    role: string | null;
    venue_id: string | null;
  }>) {
    blocks.push({
      laneId: s.venue_id ? `venue:${s.venue_id}` : "venue:unassigned",
      startHour: asHour(s.starts_at, focus),
      endHour: asHour(s.ends_at, focus),
      label: s.role ?? t("console.operations.dispatch.shiftLabel", undefined, "Shift"),
      href: `/console/workforce/rosters`,
      source: "shift",
      tone: "info",
    });
  }
  for (const task of (tasks ?? []) as Array<{ id: string; title: string; due_at: string; task_state: string }>) {
    const startH = asHour(task.due_at, focus);
    blocks.push({
      laneId: "venue:unassigned",
      startHour: startH - 0.25,
      endHour: startH + 0.25,
      label: task.title,
      href: `/console/tasks/${task.id}`,
      source: "task",
      tone: task.task_state === "done" ? "muted" : "warning",
    });
  }
  for (const r of runRows) {
    const dep = asHour(r.scheduled_depart, focus);
    const arr = r.scheduled_arrive ? asHour(r.scheduled_arrive, focus) : dep + 0.5;
    blocks.push({
      laneId: `vehicle:${vehicleKey(r)}`,
      startHour: dep,
      endHour: arr,
      label: r.vehicle_ref ?? r.fleet ?? t("console.operations.dispatch.runLabel", undefined, "Run"),
      href: `/console/transport/dispatch/${r.id}`,
      source: "dispatch",
      tone: "success",
    });
  }

  const lanes: Lane[] = [...venueLanes, ...vehicleLanes];
  const lanesById = new Map(lanes.map((l) => [l.id, l]));
  const byLane = new Map<string, Block[]>();
  for (const b of blocks) {
    if (!lanesById.has(b.laneId)) continue;
    const list = byLane.get(b.laneId) ?? [];
    list.push(b);
    byLane.set(b.laneId, list);
  }

  const prevDate = new Date(focus.getTime() - 86400_000).toISOString().slice(0, 10);
  const nextDate = new Date(focus.getTime() + 86400_000).toISOString().slice(0, 10);

  const totalHours = HOURS.length;
  const colWidth = 60; // px per hour
  const laneHeight = 56;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.eyebrow", undefined, "Operations")}
        title={t("console.operations.dispatch.matrixTitle", undefined, "Dispatch Matrix")}
        subtitle={t(
          "console.operations.dispatch.subtitle",
          { date: dateStr, blocks: blocks.length, lanes: lanes.length },
          `${dateStr} · ${blocks.length} blocks across ${lanes.length} lanes (read-only)`,
        )}
      />
      <div className="page-content space-y-4">
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={`/console/operations/dispatch?date=${prevDate}`}
            className="text-[var(--p-accent)] hover:underline"
          >
            ← {prevDate}
          </Link>
          <span className="font-mono text-xs text-[var(--p-text-2)]">{dateStr}</span>
          <Link
            href={`/console/operations/dispatch?date=${nextDate}`}
            className="text-[var(--p-accent)] hover:underline"
          >
            {nextDate} →
          </Link>
          <span className="ms-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[var(--p-info)]" />
              {t("console.operations.dispatch.legend.shift", undefined, "Shift")}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[var(--p-warning)]" />
              {t("console.operations.dispatch.legend.task", undefined, "Task")}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[var(--p-success)]" />
              {t("console.operations.dispatch.legend.dispatch", undefined, "Dispatch")}
            </span>
          </span>
        </nav>

        <div className="surface overflow-x-auto">
          {/* Time header */}
          <div className="sticky top-0 flex border-b border-[var(--p-border)] bg-[var(--p-surface)]">
            <div
              style={{ width: 180 }}
              className="shrink-0 border-e border-[var(--p-border)] px-3 py-2 text-[10px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase"
            >
              {t("console.operations.dispatch.laneColumn", undefined, "Lane")}
            </div>
            <div className="flex" style={{ width: colWidth * totalHours }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ width: colWidth }}
                  className="border-e border-[var(--p-border)] px-2 py-2 font-mono text-[10px] text-[var(--p-text-2)]"
                >
                  {h.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* Lanes */}
          {lanes.map((lane) => {
            const items = byLane.get(lane.id) ?? [];
            return (
              <div key={lane.id} className="flex border-b border-[var(--p-border)]">
                <div
                  style={{ width: 180, height: laneHeight }}
                  className="flex shrink-0 items-center border-e border-[var(--p-border)] px-3 text-xs"
                >
                  <Badge variant={lane.kind === "venue" ? "muted" : "info"} className="me-2">
                    {lane.kind === "venue"
                      ? t("console.operations.dispatch.laneKind.venue", undefined, "venue")
                      : t("console.operations.dispatch.laneKind.vehicle", undefined, "vehicle")}
                  </Badge>
                  <span className="truncate">{lane.label}</span>
                </div>
                <div className="relative" style={{ width: colWidth * totalHours, height: laneHeight }}>
                  {/* hour gridlines */}
                  {HOURS.map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-e border-[var(--p-border)] opacity-30"
                      style={{ left: idx * colWidth, width: colWidth }}
                    />
                  ))}
                  {/* blocks */}
                  {items.map((b, i) => {
                    const startCol = Math.max(0, b.startHour - HOURS[0]);
                    const widthHrs = Math.max(0.25, b.endHour - b.startHour);
                    if (b.startHour > HOURS[HOURS.length - 1] + 1) return null;
                    if (b.endHour < HOURS[0]) return null;
                    return (
                      <Link
                        key={`${b.laneId}-${i}`}
                        href={b.href}
                        className="absolute top-1.5 bottom-1.5 overflow-hidden rounded border border-[var(--p-border)] bg-[var(--p-surface)] px-2 py-1 text-[11px]"
                        style={{ left: startCol * colWidth, width: widthHrs * colWidth }}
                        title={b.label}
                      >
                        <span
                          className={`me-1 inline-block h-1.5 w-1.5 rounded-sm ${
                            b.source === "shift"
                              ? "bg-[var(--p-info)]"
                              : b.source === "task"
                                ? "bg-[var(--p-warning)]"
                                : "bg-[var(--p-success)]"
                          }`}
                        />
                        <span className="font-medium">{b.label}</span>
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
