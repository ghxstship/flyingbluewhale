"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { transitionPunchItem } from "./[id]/actions";

export type PunchKanbanRow = {
  id: string;
  code: string;
  title: string;
  status: "open" | "in_progress" | "ready_for_review" | "complete" | "void";
  priority: "low" | "normal" | "high" | "urgent";
  due_at: string | null;
  closed_at: string | null;
  show_ready_gate: boolean;
};

const LANES: KanbanLane<PunchKanbanRow>[] = [
  { id: "open", title: "Open", tone: "warn" },
  { id: "in_progress", title: "In Progress", tone: "info" },
  { id: "ready_for_review", title: "Review", tone: "info" },
  { id: "complete", title: "Complete", tone: "success" },
  { id: "void", title: "Void", tone: "neutral" },
];

const PRIORITY_TONE: Record<PunchKanbanRow["priority"], "muted" | "info" | "warning" | "error"> = {
  low: "muted",
  normal: "info",
  high: "warning",
  urgent: "error",
};

export function PunchKanban({ rows }: { rows: PunchKanbanRow[] }): React.ReactElement {
  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    await transitionPunchItem(rowId, toLaneId as PunchKanbanRow["status"]);
  }, []);

  return (
    <KanbanBoard<PunchKanbanRow>
      rows={rows}
      lanes={LANES}
      laneOf={(r) => r.status}
      hrefOf={(r) => `/console/punch/${r.id}`}
      onMove={onMove}
      emptyTitle="No punch items"
      emptyDescription="Punch items capture show-ready gaps. Add one per gap."
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{r.code}</span>
            {r.show_ready_gate && (
              <span title="Show-ready gate" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
            )}
          </div>
          <div className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">{r.title}</div>
          <div className="flex items-center justify-between gap-2">
            <Badge variant={PRIORITY_TONE[r.priority]} className="text-[10px] uppercase">
              {r.priority}
            </Badge>
            <DueDateBadge dueAt={r.due_at} closedAt={r.closed_at} status={r.status} size="sm" />
          </div>
        </div>
      )}
    />
  );
}
