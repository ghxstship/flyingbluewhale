"use client";
import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { RecordCombobox } from "@/components/RecordCombobox";
import { AtomPicker } from "@/components/xpms/AtomPicker";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createTaskAction } from "../actions";

export type AtomOptionWithProject = {
  id: string;
  identifier: string;
  name: string;
  project_id: string;
  project_name: string | null;
};

export function NewTaskForm({ atoms }: { atoms: AtomOptionWithProject[] }) {
  const t = useT();
  const [projectId, setProjectId] = useState<string>("");
  // When a project is picked, narrow atoms to that project. With no
  // project selected, hide the picker — tasks.xpms_atom_id has no home
  // without a project anyway.
  const scoped = projectId ? atoms.filter((a) => a.project_id === projectId) : [];
  return (
    <FormShell
      action={createTaskAction}
      cancelHref="/studio/tasks"
      submitLabel={t("console.tasks.new.submit", undefined, "Create Task")}
    >
      <Input label={t("console.tasks.new.title", undefined, "Title")} name="title" required maxLength={200} />
      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.tasks.new.description", undefined, "Description")}
        </label>
        <textarea id="description" name="description" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label={t("console.tasks.new.due", undefined, "Due")} name="due_at" type="date" />
        <div>
          <label htmlFor="priority" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.tasks.new.priority", undefined, "Priority")}
          </label>
          <select id="priority" name="priority" defaultValue="2" className="ps-input mt-1.5 w-full">
            <option value="1">{t("console.tasks.new.priorityP1", undefined, "P1 · Urgent")}</option>
            <option value="2">{t("console.tasks.new.priorityP2", undefined, "P2 · High")}</option>
            <option value="3">{t("console.tasks.new.priorityP3", undefined, "P3 · Normal")}</option>
            <option value="4">{t("console.tasks.new.priorityP4", undefined, "P4 · Low")}</option>
          </select>
        </div>
        <RecordCombobox
          table="projects"
          name="project_id"
          label={t("console.tasks.new.project", undefined, "Project")}
          noneLabel={t("console.tasks.new.noProjectOption", undefined, "No project")}
          searchPlaceholder={t("console.tasks.new.searchProjects", undefined, "Search projects…")}
          emptyLabel={t("console.tasks.new.noProjectMatches", undefined, "No matching projects")}
          onValueChange={setProjectId}
        />
      </div>
      {projectId && scoped.length > 0 && (
        <AtomPicker
          name="xpms_atom_id"
          atoms={scoped}
          hint={t(
            "console.tasks.new.atomHint",
            undefined,
            "Pin this task to a WBS atom so it rolls up on the project Tracker.",
          )}
        />
      )}
    </FormShell>
  );
}
