"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views/KanbanBoard";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { transitionPunchItem } from "./[id]/actions";
import { PRIORITY_TONE } from "@/lib/tones";

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

export function PunchKanban({ rows }: { rows: PunchKanbanRow[] }): React.ReactElement {
  const t = useT();
  const lanes: KanbanLane<PunchKanbanRow>[] = React.useMemo(
    () => [
      { id: "open", title: t("console.punch.kanban.lane.open", undefined, "Open"), tone: "warn" },
      { id: "in_progress", title: t("console.punch.kanban.lane.inProgress", undefined, "In Progress"), tone: "info" },
      { id: "ready_for_review", title: t("console.punch.kanban.lane.review", undefined, "Review"), tone: "info" },
      { id: "complete", title: t("console.punch.kanban.lane.complete", undefined, "Complete"), tone: "success" },
      { id: "void", title: t("console.punch.kanban.lane.void", undefined, "Void"), tone: "neutral" },
    ],
    [t],
  );

  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    await transitionPunchItem(rowId, toLaneId as PunchKanbanRow["status"]);
  }, []);

  return (
    <KanbanBoard<PunchKanbanRow>
      rows={rows}
      lanes={lanes}
      laneOf={(r) => r.status}
      hrefOf={(r) => `/console/punch/${r.id}`}
      onMove={onMove}
      emptyTitle={t("console.punch.kanban.emptyTitle", undefined, "No punch items")}
      emptyDescription={t(
        "console.punch.kanban.emptyDescription",
        undefined,
        "Punch items capture show-ready gaps. Add one per gap.",
      )}
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] text-[var(--p-text-2)]">{r.code}</span>
            {r.show_ready_gate && (
              <span
                title={t("console.punch.kanban.showReadyGate", undefined, "Show-ready gate")}
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--p-danger)]"
              />
            )}
          </div>
          <div className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">{r.title}</div>
          <div className="flex items-center justify-between gap-2">
            <Badge variant={PRIORITY_TONE[r.priority] ?? "default"} className="text-[10px] uppercase">
              {r.priority}
            </Badge>
            <DueDateBadge dueAt={r.due_at} closedAt={r.closed_at} status={r.status} size="sm" />
          </div>
        </div>
      )}
    />
  );
}
