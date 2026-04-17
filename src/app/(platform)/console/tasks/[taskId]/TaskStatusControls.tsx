"use client";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { setTaskStatusAction } from "../actions";
import type { TaskStatus } from "@/lib/supabase/types";

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
  blocked: "in_progress",
};

export function TaskStatusControls({ id, status }: { id: string; status: TaskStatus }) {
  const [pending, start] = useTransition();
  const next = NEXT[status];
  return (
    <div className="flex gap-2">
      {next && (
        <Button disabled={pending} onClick={() => start(async () => {
          const r = await setTaskStatusAction(id, next);
          if (r?.error) toast.error(r.error); else toast.success(`Moved to ${next}`);
        })}>{pending ? "…" : `→ ${next.replace("_", " ")}`}</Button>
      )}
      {status !== "blocked" && status !== "done" && (
        <Button variant="secondary" disabled={pending} onClick={() => start(async () => {
          const r = await setTaskStatusAction(id, "blocked");
          if (r?.error) toast.error(r.error); else toast.success("Blocked");
        })}>Block</Button>
      )}
    </div>
  );
}
