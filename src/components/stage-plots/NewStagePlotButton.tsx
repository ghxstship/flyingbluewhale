"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

/**
 * Create-and-navigate button for the stage-plot flow. Prompts for a name,
 * POSTs /api/v1/stage-plots with empty elements, redirects to the canvas
 * editor. Kept minimal — the real UX happens on the editor page.
 */
export function NewStagePlotButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  async function create() {
    const name = window.prompt("Stage plot name", "Main stage");
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/stage-plots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, name, widthFt: 32, depthFt: 24, elements: [] }),
      });
      const json = await res.json();
      if (json?.ok && json.data?.stagePlot?.id) {
        router.push(`/console/projects/${projectId}/stage-plots/${json.data.stagePlot.id}`);
      } else {
        toast.error(json?.error?.message ?? "Create failed");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={creating}
      className="inline-flex items-center gap-1 rounded bg-[var(--org-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
    >
      <Plus size={12} /> New stage plot
    </button>
  );
}
