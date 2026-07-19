"use client";

import { HubChrome } from "@/components/mobile/HubChrome";
import { NormalizedList, ListRow, type FieldDef } from "@/components/mobile/kit";
import type { ProjectEvent } from "@/lib/mobile/project-xpms";

/**
 * Project Calendar — XPMS-keyed events (the field slice of the ATLVS unified
 * schedule). Agenda view by date is the default; the same schema drives
 * list/table/board. `My Calendar` (/m/schedule) is the personal slice.
 */
const STATUS_TONE: Record<string, string> = { Scheduled: "info", Upcoming: "text-3", Done: "success" };
const PHASE_ORDER = ["Discover", "Design", "Advance", "Procure", "Build", "Install", "Operate", "Amplify", "Close"];

const FIELDS: FieldDef<ProjectEvent>[] = [
  { id: "title", label: "Event", type: "text", get: (x) => x.title },
  { id: "date", label: "When", type: "date", get: (x) => x.event_date, iso: (x) => x.event_iso },
  { id: "status", label: "Status", type: "select", options: ["Scheduled", "Upcoming", "Done"], get: (x) => x.status },
  { id: "phase", label: "Phase", type: "select", options: PHASE_ORDER, get: (x) => x.phase },
  { id: "department", label: "Department", type: "select", get: (x) => x.department },
  { id: "owner", label: "Owner", type: "text", get: (x) => x.owner ?? "" },
];

function StatusChip({ status }: { status: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--p-text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${STATUS_TONE[status] ?? "text-3"})` }} />
      {status}
    </span>
  );
}

export function ProjectCalendarView({ items, canManage }: { items: ProjectEvent[]; canManage: boolean }) {
  const row = (x: ProjectEvent, compact?: boolean) => (
    <ListRow
      key={x.id}
      icon="CalendarDays"
      title={x.title}
      sub={compact ? x.event_date : `${x.event_date} · ${x.department} · ${x.owner ?? "—"}`}
      right={<StatusChip status={x.status} />}
    />
  );
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="calendar" canManage={canManage} />
      <NormalizedList
        k="pcal"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.title} ${x.sub ?? ""} ${x.department} ${x.owner ?? ""} ${x.event_date}`}
        searchPlaceholder="Search project calendar…"
        renderRow={row}
        views={["calendar", "list", "table"]}
        initialView="calendar"
        dateField="date"
        pill={{ get: (x) => x.status, order: ["Scheduled", "Upcoming", "Done"] }}
        empty={{ cols: ["Event", "When", "Status"], title: "No project events", hint: "The project schedule shows here." }}
      />
    </div>
  );
}
