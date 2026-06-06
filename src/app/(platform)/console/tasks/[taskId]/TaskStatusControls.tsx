"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { setTaskStatusAction } from "../actions";
import type { TaskStatus } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
  blocked: "in_progress",
};

export function TaskStatusControls({ id, status }: { id: string; status: TaskStatus }) {
  const t = useT();
  const [pending, start] = useTransition();
  const next = NEXT[status];
  return (
    <div className="flex gap-2">
      {next && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setTaskStatusAction(id, next);
              if (r?.error) toast.error(r.error);
              else toast.success(t("console.tasks.status.movedToast", { status: next }, `Moved to ${next}`));
            })
          }
        >
          {pending ? "…" : t("console.tasks.status.advanceLabel", { next: toTitle(next) }, `→ ${toTitle(next)}`)}
        </Button>
      )}
      {status !== "blocked" && status !== "done" && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setTaskStatusAction(id, "blocked");
              if (r?.error) toast.error(r.error);
              else toast.success(t("console.tasks.status.blockedToast", undefined, "Blocked"));
            })
          }
        >
          {t("console.tasks.status.block", undefined, "Block")}
        </Button>
      )}
    </div>
  );
}
