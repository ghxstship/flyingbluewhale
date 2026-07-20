"use client";

import { useState } from "react";
import { HubChrome } from "@/components/mobile/HubChrome";
import { NormalizedList, ListRow, RecordDetail, type FieldDef } from "@/components/mobile/kit";
import type { ProjectTask } from "@/lib/mobile/project-xpms";

/**
 * Project Tasks — the XPMS SSOT field task dataset (all crew). One schema
 * drives list/table/board/calendar; the board (columns = phase) + group-by
 * department IS the Coordinate Matrix. `My Tasks` (/m/tasks) is the personal
 * slice of this; here every crew member's work item shows.
 */
const STATUS_TONE: Record<string, string> = {
  Open: "text-3",
  "In progress": "info",
  Blocked: "warning",
  Done: "success",
};
const PRIORITY_TONE: Record<string, string> = { High: "danger", Medium: "warning", Low: "text-3" };
const PHASE_ORDER = ["Discover", "Design", "Advance", "Procure", "Build", "Install", "Operate", "Amplify", "Close"];

const FIELDS: FieldDef<ProjectTask>[] = [
  { id: "title", label: "Task", type: "text", get: (x) => x.title },
  { id: "status", label: "Status", type: "select", options: ["Open", "In progress", "Blocked", "Done"], get: (x) => x.status },
  { id: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"], get: (x) => x.priority },
  { id: "phase", label: "Phase", type: "select", options: PHASE_ORDER, get: (x) => x.phase },
  { id: "department", label: "Department", type: "select", get: (x) => x.department },
  { id: "discipline", label: "Discipline", type: "select", get: (x) => x.discipline },
  { id: "coordinate", label: "Coordinate", type: "text", get: (x) => x.coordinate },
  { id: "assignee", label: "Assignee", type: "text", get: (x) => x.assignee ?? "" },
  { id: "trade", label: "Trade", type: "select", get: (x) => x.trade ?? "" },
  { id: "company", label: "Company", type: "text", get: (x) => x.company ?? "" },
  { id: "location", label: "Location", type: "text", get: (x) => x.location ?? "" },
  { id: "due", label: "Due", type: "text", get: (x) => x.due ?? "" },
];

function StatusChip({ status }: { status: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--p-text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${STATUS_TONE[status] ?? "text-3"})` }} />
      {status}
    </span>
  );
}

export function ProjectTasksView({ items, canManage }: { items: ProjectTask[]; canManage: boolean }) {
  const [detail, setDetail] = useState<ProjectTask | null>(null);
  const row = (x: ProjectTask, compact?: boolean) => (
    <ListRow
      key={x.id}
      icon="ListChecks"
      iconColor={`var(--p-${PRIORITY_TONE[x.priority] ?? "text-3"})`}
      title={x.title}
      sub={compact ? `${x.coordinate} · ${x.assignee ?? "—"}` : `${x.coordinate} · ${x.department} · ${x.assignee ?? "—"} · Due ${x.due ?? "—"}`}
      right={<StatusChip status={x.status} />}
      onClick={() => setDetail(x)}
    />
  );
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="tasks" canManage={canManage} />
      <NormalizedList
        k="ptask"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.title} ${x.sub ?? ""} ${x.assignee ?? ""} ${x.department} ${x.discipline} ${x.coordinate} ${x.trade ?? ""} ${x.company ?? ""}`}
        searchPlaceholder="Search project tasks…"
        renderRow={row}
        onRow={setDetail}
        views={["list", "table", "board"]}
        statusField="phase"
        statusOrder={PHASE_ORDER}
        pill={{ get: (x) => x.priority, order: ["High", "Medium", "Low"] }}
        empty={{ cols: ["Task", "Coordinate", "Status"], title: "No project tasks", hint: "Tasks assigned across the project show here." }}
      />
      {detail && (
        <RecordDetail
          title={detail.title}
          icon="ListChecks"
          status={{ tone: STATUS_TONE[detail.status] ?? "neutral", label: detail.status }}
          fields={[
            { k: "Coordinate", v: detail.coordinate },
            { k: "XPMS Atom", v: detail.xpms_atom_id },
            { k: "Department", v: detail.department },
            { k: "Discipline", v: detail.discipline },
            { k: "Category", v: detail.category },
            { k: "Phase", v: detail.phase },
            { k: "Priority", v: detail.priority },
            { k: "Assignee", v: detail.assignee ?? "—" },
            { k: "Trade", v: detail.trade ?? "—" },
            { k: "Company", v: detail.company ?? "—" },
            { k: "Location", v: detail.location ?? "—" },
            { k: "Due", v: detail.due ?? "—" },
            ...(detail.sub ? [{ k: "Notes", v: detail.sub, full: true }] : []),
          ]}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
