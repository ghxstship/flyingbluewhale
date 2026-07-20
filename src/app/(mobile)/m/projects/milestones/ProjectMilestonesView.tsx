"use client";

import { useState } from "react";
import { HubChrome } from "@/components/mobile/HubChrome";
import { NormalizedList, ListRow, RecordDetail, type FieldDef } from "@/components/mobile/kit";
import type { ProjectMilestone } from "@/lib/mobile/project-xpms";

/**
 * Milestones — deliverables that roll up to each field phase (Advance →
 * Load-Out). Default grouping is by phase (the rollup); the schema also drives
 * list/table/board views.
 */
const STATUS_TONE: Record<string, string> = { Done: "success", "At Risk": "danger", "On Track": "info", Upcoming: "text-3" };
const PHASE_ORDER = ["Advance", "Load-In", "Show Days", "Load-Out"];

const FIELDS: FieldDef<ProjectMilestone>[] = [
  { id: "title", label: "Milestone", type: "text", get: (x) => x.title },
  { id: "phase", label: "Phase", type: "select", options: PHASE_ORDER, get: (x) => x.phase },
  { id: "status", label: "Status", type: "select", options: ["Done", "At Risk", "On Track", "Upcoming"], get: (x) => x.status },
  { id: "owner", label: "Owner", type: "text", get: (x) => x.owner ?? "" },
  { id: "milestone_date", label: "Date", type: "text", get: (x) => x.milestone_date },
];

function StatusChip({ status }: { status: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--p-text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--p-${STATUS_TONE[status] ?? "text-3"})` }} />
      {status}
    </span>
  );
}

export function ProjectMilestonesView({ items, canManage }: { items: ProjectMilestone[]; canManage: boolean }) {
  const [detail, setDetail] = useState<ProjectMilestone | null>(null);
  const row = (x: ProjectMilestone) => (
    <ListRow key={x.id} icon="Flag" title={x.title} sub={`${x.phase} · ${x.milestone_date} · ${x.owner ?? "—"}`} right={<StatusChip status={x.status} />} onClick={() => setDetail(x)} />
  );
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="milestones" canManage={canManage} />
      <NormalizedList
        k="pms"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.title} ${x.phase} ${x.owner ?? ""} ${x.milestone_date}`}
        searchPlaceholder="Search milestones…"
        renderRow={row}
        onRow={setDetail}
        views={["list", "table", "board"]}
        statusField="status"
        statusOrder={["Upcoming", "On Track", "At Risk", "Done"]}
        boardTone={STATUS_TONE}
        pill={{ get: (x) => x.phase, order: PHASE_ORDER }}
        empty={{ cols: ["Milestone", "Phase", "Status"], title: "No milestones", hint: "Project milestones roll up here by phase." }}
      />
      {detail && (
        <RecordDetail
          title={detail.title}
          icon="Flag"
          status={{ tone: STATUS_TONE[detail.status] ?? "neutral", label: detail.status }}
          fields={[
            { k: "Phase", v: detail.phase },
            { k: "Date", v: detail.milestone_date },
            { k: "Owner", v: detail.owner ?? "—" },
          ]}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
