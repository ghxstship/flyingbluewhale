"use client";

import * as React from "react";
import { KanbanBoard, type KanbanLane } from "@/components/views";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { setTaskStatusAction } from "./actions";

const LANES: KanbanLane<Task>[] = [
  { id: "todo", title: "Not Started", tone: "neutral" },
  { id: "in_progress", title: "In Progress", tone: "info" },
  { id: "blocked", title: "Blocked", tone: "warn" },
  { id: "review", title: "Review", tone: "info" },
  { id: "done", title: "Done", tone: "success" },
];

export function TasksKanban({ rows }: { rows: Task[] }): React.ReactElement {
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
      laneOf={(r) => r.status}
      hrefOf={(r) => `/console/tasks/${r.id}`}
      onMove={onMove}
      emptyTitle="No tasks yet"
      emptyDescription="Add a task to start populating the board."
      renderCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">{r.title}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">P{r.priority}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <DueDateBadge dueAt={r.due_at} status={r.status} size="sm" />
          </div>
        </div>
      )}
    />
  );
}
