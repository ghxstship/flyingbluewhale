"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views/KanbanBoard";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { setTaskStatusAction } from "./actions";

export function TasksKanban({ rows }: { rows: Task[] }): React.ReactElement {
  const t = useT();
  const LANES: KanbanLane<Task>[] = [
    { id: "todo", title: t("console.tasks.kanban.lane.todo", undefined, "Not Started"), tone: "neutral" },
    { id: "in_progress", title: t("console.tasks.kanban.lane.inProgress", undefined, "In Progress"), tone: "info" },
    { id: "blocked", title: t("console.tasks.kanban.lane.blocked", undefined, "Blocked"), tone: "warn" },
    { id: "review", title: t("console.tasks.kanban.lane.review", undefined, "Review"), tone: "info" },
    { id: "done", title: t("console.tasks.kanban.lane.done", undefined, "Done"), tone: "success" },
  ];
  const onMove = React.useCallback(async (rowId: string, toLaneId: string) => {
    const result = await setTaskStatusAction(rowId, toLaneId as TaskStatus);
    if (result && "error" in result && result.error) {
      throw new Error(result.error);
    }
  }, []);

  return (
    <KanbanBoard<Task>
      rows={rows}
      lanes={LANES}
      laneOf={(r) => r.task_state}
      hrefOf={(r) => `/studio/tasks/${r.id}`}
      onMove={onMove}
      emptyTitle={t("console.tasks.kanban.emptyTitle", undefined, "No tasks yet")}
      emptyDescription={t(
        "console.tasks.kanban.emptyDescription",
        undefined,
        "Add a task to start populating the board.",
      )}
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium text-[var(--p-text-1)]">{r.title}</span>
            <span className="font-mono text-[11px] text-[var(--p-text-2)]">P{r.priority}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <DueDateBadge dueAt={r.due_at} status={r.task_state} size="sm" />
          </div>
        </div>
      )}
    />
  );
}
