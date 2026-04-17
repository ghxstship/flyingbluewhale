"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTaskAction } from "../actions";

export function NewTaskForm({ projects }: { projects: { id: string; name: string }[] }) {
  return (
    <FormShell action={createTaskAction} cancelHref="/console/tasks" submitLabel="Create task">
      <Input label="Title" name="title" required maxLength={200} />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={3} className="input-base mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Due" name="due_at" type="date" />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Priority</label>
          <select name="priority" defaultValue="2" className="input-base mt-1.5 w-full">
            <option value="1">P1 · Urgent</option>
            <option value="2">P2 · High</option>
            <option value="3">P3 · Normal</option>
            <option value="4">P4 · Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project</label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </FormShell>
  );
}
