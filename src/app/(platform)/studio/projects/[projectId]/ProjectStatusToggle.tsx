"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { updateProjectAction } from "../actions";
import type { ProjectState } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n/LocaleProvider";

const NEXT_STATE: Partial<Record<ProjectState, ProjectState>> = {
  draft: "active",
  active: "paused",
  paused: "active",
  archived: "active",
  complete: "archived",
};

export function ProjectStatusToggle({ projectId, projectState }: { projectId: string; projectState: ProjectState }) {
  const t = useT();
  const [pending, start] = useTransition();
  const next = NEXT_STATE[projectState];
  if (!next) return null;

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("project_state", next);
          const res = await updateProjectAction(projectId, fd);
          if (res?.error) toast.error(res.error);
          else toast.success(t("console.projects.statusToggle.markedToast", { state: next }, `Marked ${next}`));
        })
      }
    >
      {pending
        ? t("console.projects.statusToggle.updating", undefined, "Updating…")
        : t("console.projects.statusToggle.markAction", { state: next }, `Mark ${next}`)}
    </Button>
  );
}
