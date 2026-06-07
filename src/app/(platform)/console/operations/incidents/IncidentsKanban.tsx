"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { useT } from "@/lib/i18n/LocaleProvider";
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

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

export function IncidentsKanban({ rows }: { rows: IncidentKanbanRow[] }): React.ReactElement {
  const t = useT();
  const lanes = React.useMemo<KanbanLane<IncidentKanbanRow>[]>(
    () => [
      { id: "open", title: t("console.operations.incidents.kanban.lane.open", undefined, "Open"), tone: "warn" },
      {
        id: "investigating",
        title: t("console.operations.incidents.kanban.lane.investigating", undefined, "Investigating"),
        tone: "info",
      },
      {
        id: "resolved",
        title: t("console.operations.incidents.kanban.lane.resolved", undefined, "Resolved"),
        tone: "success",
      },
      {
        id: "closed",
        title: t("console.operations.incidents.kanban.lane.closed", undefined, "Closed"),
        tone: "neutral",
      },
    ],
    [t],
  );
  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    await setIncidentStatus(rowId, toLaneId as IncidentStatus);
  }, []);

  return (
    <KanbanBoard<IncidentKanbanRow>
      rows={rows}
      lanes={lanes}
      laneOf={(r) => r.status}
      hrefOf={(r) => `/console/operations/incidents/${r.id}`}
      onMove={onMove}
      emptyTitle={t("console.operations.incidents.kanban.emptyTitle", undefined, "No incidents reported")}
      emptyDescription={t(
        "console.operations.incidents.kanban.emptyDescription",
        undefined,
        "Field-log from the mobile shell or log one from the console.",
      )}
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <StatusChip tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</StatusChip>
          </div>
          <div className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">{r.summary}</div>
          {r.location && <div className="text-[10px] text-[var(--p-text-2)]">{r.location}</div>}
        </div>
      )}
    />
  );
}
