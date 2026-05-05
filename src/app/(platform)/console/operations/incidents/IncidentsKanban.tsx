"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { setIncidentStatus, type IncidentStatus } from "./actions";

export type IncidentKanbanRow = {
  id: string;
  summary: string;
  severity: string;
  status: string;
  occurred_at: string;
  closed_at: string | null;
  location: string | null;
};

const LANES: KanbanLane<IncidentKanbanRow>[] = [
  { id: "open", title: "Open", tone: "warn" },
  { id: "investigating", title: "Investigating", tone: "info" },
  { id: "resolved", title: "Resolved", tone: "success" },
  { id: "closed", title: "Closed", tone: "neutral" },
];

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

export function IncidentsKanban({ rows }: { rows: IncidentKanbanRow[] }): React.ReactElement {
  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    await setIncidentStatus(rowId, toLaneId as IncidentStatus);
  }, []);

  return (
    <KanbanBoard<IncidentKanbanRow>
      rows={rows}
      lanes={LANES}
      laneOf={(r) => r.status}
      hrefOf={(r) => `/console/operations/incidents/${r.id}`}
      onMove={onMove}
      emptyTitle="No incidents reported"
      emptyDescription="Field-log from the mobile shell or log one from the console."
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <StatusChip tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</StatusChip>
          </div>
          <div className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">{r.summary}</div>
          {r.location && <div className="text-[10px] text-[var(--text-muted)]">{r.location}</div>}
        </div>
      )}
    />
  );
}
