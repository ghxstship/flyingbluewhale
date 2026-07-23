"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SPRINT_STATES, SPRINT_STATE_LABELS } from "@/lib/sprints";
import { createSprintAction, createStoryAction } from "./actions";
import type { State } from "./actions";

/** New-sprint form. Binds projectId into the server action. */
export function NewSprintForm({ projectId }: { projectId: string }) {
  const t = useT();
  const action = (state: State, fd: FormData) => createSprintAction(projectId, state, fd);
  return (
    <FormShell
      action={action}
      cancelHref={`/studio/projects/${projectId}/sprints`}
      submitLabel={t("console.projects.sprints.new.submit", undefined, "Create Sprint")}
    >
      <Input label={t("console.projects.sprints.new.fields.name", undefined, "Name")} name="name" required maxLength={160} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.projects.sprints.new.fields.startsOn", undefined, "Starts On")} name="starts_on" type="date" />
        <Input label={t("console.projects.sprints.new.fields.endsOn", undefined, "Ends On")} name="ends_on" type="date" />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="sprint_state">
          {t("console.projects.sprints.new.fields.state", undefined, "State")}
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
          {t("console.projects.sprints.new.fields.goal", undefined, "Goal")}
        </label>
        <textarea id="goal" name="goal" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}

/** Inline add-story form for a specific sprint's backlog. */
export function AddStoryForm({ projectId, sprintId }: { projectId: string; sprintId: string }) {
  const t = useT();
  const action = (state: State, fd: FormData) => createStoryAction(projectId, state, fd);
  return (
    <FormShell action={action} submitLabel={t("console.projects.sprints.story.submit", undefined, "Add Story")} dirtyGuard={false}>
      <input type="hidden" name="sprint_id" value={sprintId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Input
          label={t("console.projects.sprints.story.fields.story", undefined, "Story")}
          name="title"
          required
          maxLength={280}
          placeholder={t("console.projects.sprints.story.placeholders.story", undefined, "As a user, I can…")}
        />
        <Input
          label={t("console.projects.sprints.story.fields.points", undefined, "Points")}
          name="points"
          type="number"
          min={0}
          max={999}
          defaultValue={0}
        />
      </div>
    </FormShell>
  );
}
