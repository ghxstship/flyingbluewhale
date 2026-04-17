"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProjectAction, type CreateProjectState } from "../actions";

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(createProjectAction, null);

  return (
    <form action={formAction} className="card-elevated space-y-4 p-6">
      <Input label="Project name" name="name" required maxLength={120} />
      <div>
        <label className="text-label text-[var(--color-text-tertiary)]">Description</label>
        <textarea name="description" rows={4} maxLength={2000} className="input mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start date" name="startDate" type="date" />
        <Input label="End date" name="endDate" type="date" />
      </div>
      {state?.error ? (
        <div className="rounded border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">
          {state.error}
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button href="/console/projects" variant="ghost">Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create project"}</Button>
      </div>
    </form>
  );
}
