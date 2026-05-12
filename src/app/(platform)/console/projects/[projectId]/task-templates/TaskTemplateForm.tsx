"use client";

import { useActionState } from "react";
import { bulkCreateTasksFromTemplate, type BulkCreateState } from "./actions";
import { Badge } from "@/components/ui/Badge";

const TEMPLATE_OPTIONS = [
  { value: "concert", label: "Concert / Single Show" },
  { value: "festival", label: "Festival / Multi-Stage" },
  { value: "corporate", label: "Corporate Event" },
  { value: "sport", label: "Sport / Athletics" },
  { value: "broadcast", label: "Broadcast / Streaming" },
  { value: "touring", label: "Touring Production" },
] as const;

type Props = { projectId: string };

export default function TaskTemplateForm({ projectId }: Props) {
  const [state, action, pending] = useActionState<BulkCreateState, FormData>(bulkCreateTasksFromTemplate, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      <label className="block text-xs font-semibold">
        Event Type
        <select
          name="templateKey"
          required
          className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          {TEMPLATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-semibold">
        Days to adjust all due dates (0 = use project start date as-is)
        <input
          type="number"
          name="offsetDays"
          defaultValue={0}
          min={-60}
          max={0}
          className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
        />
      </label>

      {state?.success && (
        <div className="flex items-center gap-2 rounded-md bg-[var(--surface-inset)] p-3 text-sm">
          <Badge variant="success">Done</Badge>
          <span>{state.count} tasks created successfully.</span>
        </div>
      )}

      {state?.error && (
        <div className="rounded-md p-3 text-sm" style={{ color: "var(--color-error,#ef4444)" }}>
          {state.error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creating tasks…" : "Generate Tasks from Template"}
      </button>
    </form>
  );
}
