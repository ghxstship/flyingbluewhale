"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { updateProjectAction } from "../actions";
import type { ProjectStatus } from "@/lib/supabase/types";

const NEXT_STATUS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  draft: "active",
  active: "paused",
  paused: "active",
  archived: "active",
  complete: "archived",
};

export function ProjectStatusToggle({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const [pending, start] = useTransition();
  const next = NEXT_STATUS[status];
  if (!next) return null;

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("status", next);
          const res = await updateProjectAction(projectId, fd);
          if (res?.error) toast.error(res.error);
          else toast.success(`Marked ${next}`);
        })
      }
    >
      {pending ? "Updating…" : `Mark ${next}`}
    </Button>
  );
}
