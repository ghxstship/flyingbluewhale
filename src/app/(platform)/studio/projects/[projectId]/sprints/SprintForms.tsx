"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { SPRINT_STATES, SPRINT_STATE_LABELS } from "@/lib/sprints";
import { createSprintAction, createStoryAction } from "./actions";
import type { State } from "./actions";

/** New-sprint form. Binds projectId into the server action. */
export function NewSprintForm({ projectId }: { projectId: string }) {
  const action = (state: State, fd: FormData) => createSprintAction(projectId, state, fd);
  return (
    <FormShell action={action} cancelHref={`/studio/projects/${projectId}/sprints`} submitLabel="Create Sprint">
      <Input label="Name" name="name" required maxLength={160} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts On" name="starts_on" type="date" />
        <Input label="Ends On" name="ends_on" type="date" />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="sprint_state">
          State
        </label>
        <select id="sprint_state" name="sprint_state" defaultValue="planned" className="ps-input mt-1.5 w-full">
          {SPRINT_STATES.map((s) => (
            <option key={s} value={s}>
              {SPRINT_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="goal">
          Goal
        </label>
        <textarea id="goal" name="goal" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}

/** Inline add-story form for a specific sprint's backlog. */
export function AddStoryForm({ projectId, sprintId }: { projectId: string; sprintId: string }) {
  const action = (state: State, fd: FormData) => createStoryAction(projectId, state, fd);
  return (
    <FormShell action={action} submitLabel="Add Story" dirtyGuard={false}>
      <input type="hidden" name="sprint_id" value={sprintId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Input label="Story" name="title" required maxLength={280} placeholder="As a user, I can…" />
        <Input label="Points" name="points" type="number" min={0} max={999} defaultValue={0} />
      </div>
    </FormShell>
  );
}
