"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { createProjectAction, type State } from "../actions";

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createProjectAction, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input label="Project Name" name="name" required maxLength={120} />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={4} maxLength={2000} className="input-base mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start Date" name="startDate" type="date" />
        <Input label="End Date" name="endDate" type="date" />
      </div>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button href="/console/projects" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
