export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { TimelineView, type TimelineRow } from "./TimelineView";
import { CalendarGrid } from "./CalendarGrid";
import { BoardView } from "./BoardView";
import { MapView } from "./MapView";
import { TableView } from "./TableView";
import { Button } from "@/components/ui/Button";
import { DataViewSwitcher } from "@/components/views/DataViewSwitcher";
import { resolveDataView } from "@/components/views/resolveDataView";
import type { DataViewKind } from "@/components/views/DataViewKind";

// Schedule supports six views — data shape powers all of them:
//   tasks have due_at, status            → timeline, calendar, list, board, table
//   events have starts_at, ends_at,
//          status, location_id           → all five plus map
const SCHEDULE_VIEWS = [
  "timeline",
  "calendar",
  "table",
  "list",
  "map",
  "board",
] as const satisfies readonly DataViewKind[];
type View = (typeof SCHEDULE_VIEWS)[number];

/**
 * Project Schedule — Timeline / Calendar / List views over tasks + events.
 * Consolidates the prior Gantt and Calendar tabs into a single domain with
 * view toggle (Linear / Asana / Notion pattern). `?view=` is the state
 * lever; default is Timeline.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const view = resolveDataView<View>(sp, SCHEDULE_VIEWS, "timeline");
  const monthParam = sp.month;

  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: tasks }, { data: events }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, start_date, end_date")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, due_at, created_at")
      .eq("project_id", projectId)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("events")
      .select("id, name, description, status, starts_at, ends_at, location_id")
      .eq("project_id", projectId)
      .order("starts_at", { ascending: true }),
  ]);
  // Hydrate location names for the Map view. Empty when no events
  // carry a location_id.
  const locationIds = Array.from(new Set((events ?? []).map((e) => e.location_id).filter((id): id is string => !!id)));
  const locationMap = new Map<string, string>();
  if (locationIds.length > 0) {
    const { data: locs } = await supabase.from("locations").select("id, name").in("id", locationIds);
    for (const l of (locs ?? []) as Array<{ id: string; name: string }>) locationMap.set(l.id, l.name);
  }

  const taskRows = tasks ?? [];
  const eventRows = events ?? [];
  const hasAnything = taskRows.length > 0 || eventRows.length > 0;

  const subtitle = hasAnything
    ? `${taskRows.length} Task${taskRows.length === 1 ? "" : "s"} · ${eventRows.length} Event${
        eventRows.length === 1 ? "" : "s"
      }`
    : "Nothing Scheduled";

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Schedule"
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Schedule" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <DataViewSwitcher
              current={view}
              allowed={SCHEDULE_VIEWS}
              defaultView="timeline"
              ariaLabel="Schedule View"
            />
            <Button href={`/console/events/new?project_id=${projectId}`} size="sm">
              + New Event
            </Button>
          </div>
        }
      />
      <div className="page-content max-w-6xl">
        {!hasAnything ? (
          <EmptyState
            title="Nothing Scheduled Yet"
            description="Tasks and events for this project show up here. Add the first one to start."
            action={
              <Link
                className="text-sm font-medium text-[var(--org-primary)]"
                href={`/console/events/new?project_id=${projectId}`}
              >
                Schedule First Event →
              </Link>
            }
          />
        ) : view === "timeline" ? (
          <TimelineView
            rows={toTimelineRows(taskRows, eventRows)}
            projectStart={project?.start_date ?? null}
            projectEnd={project?.end_date ?? null}
          />
        ) : view === "calendar" ? (
          <CalendarGrid
            events={eventRows.map((e) => ({
              id: e.id,
              name: e.name,
              starts_at: e.starts_at,
              ends_at: e.ends_at,
              status: e.status,
            }))}
            tasks={taskRows.map((t) => ({
              id: t.id,
              title: t.title,
              due_at: t.due_at,
              status: t.status,
            }))}
            initialMonth={monthParam || defaultMonth(project?.start_date)}
          />
        ) : view === "board" ? (
          <BoardView
            cards={[
              ...taskRows.map((t) => ({
                id: t.id,
                kind: "task" as const,
                title: t.title,
                status: t.status ?? "open",
                due: t.due_at,
              })),
              ...eventRows.map((e) => ({
                id: e.id,
                kind: "event" as const,
                title: e.name,
                status: e.status ?? "draft",
                due: e.starts_at,
              })),
            ]}
          />
        ) : view === "map" ? (
          <MapView
            pins={eventRows.map((e) => ({
              id: e.id,
              name: e.name,
              locationName: e.location_id ? (locationMap.get(e.location_id) ?? null) : null,
              when: e.starts_at ?? "",
            }))}
          />
        ) : view === "table" ? (
          <TableView
            rows={[
              ...taskRows.map((t) => ({
                id: t.id,
                kind: "task" as const,
                title: t.title,
                status: t.status ?? "open",
                when: t.due_at,
                endsAt: null,
              })),
              ...eventRows.map((e) => ({
                id: e.id,
                kind: "event" as const,
                title: e.name,
                status: e.status ?? "draft",
                when: e.starts_at,
                endsAt: e.ends_at,
              })),
            ]}
          />
        ) : (
          <ListView events={eventRows} tasks={taskRows} />
        )}
      </div>
    </>
  );
}

function toTimelineRows(
  tasks: { id: string; title: string; status: string | null; due_at: string | null; created_at: string }[],
  events: { id: string; name: string; status: string | null; starts_at: string | null; ends_at: string | null }[],
): TimelineRow[] {
  return [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      lane: "Tasks" as const,
      start: t.created_at,
      end: t.due_at ?? t.created_at,
      status: t.status ?? "open",
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      label: e.name,
      lane: "Events" as const,
      start: e.starts_at ?? "",
      end: e.ends_at ?? e.starts_at ?? "",
      status: e.status ?? "draft",
    })),
  ].filter((r) => r.start && r.end);
}

function defaultMonth(projectStart: string | null | undefined): string {
  const d = projectStart ? new Date(projectStart) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ListView({
  events,
  tasks,
}: {
  events: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string | null;
    starts_at: string | null;
    ends_at: string | null;
  }>;
  tasks: Array<{ id: string; title: string; status: string | null; due_at: string | null }>;
}) {
  return (
    <div className="space-y-6">
      {events.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Events · {events.length}
          </h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/console/events/${e.id}`} className="surface hover-lift block p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{e.name}</div>
                      {e.description && (
                        <div className="mt-1 truncate text-xs text-[var(--text-muted)]">{e.description}</div>
                      )}
                    </div>
                    <StatusBadge status={e.status ?? "draft"} />
                  </div>
                  <div className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                    {fmtDateTime(e.starts_at)} → {fmtDateTime(e.ends_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tasks.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Tasks · {tasks.length}
          </h2>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link href={`/console/tasks/${t.id}`} className="surface hover-lift block p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm">{t.title}</div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="font-mono">{t.due_at ? fmtDateTime(t.due_at) : "No due date"}</span>
                      <StatusBadge status={t.status ?? "open"} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
