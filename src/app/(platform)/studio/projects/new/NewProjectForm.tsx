"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createProjectAction, type CreateProjectState } from "../actions";

type Option = { id: string; name: string };

export function NewProjectForm({ clients = [], venues = [] }: { clients?: Option[]; venues?: Option[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(createProjectAction, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input
        label={t("console.projects.new.projectName", undefined, "Project Name")}
        name="name"
        required
        maxLength={120}
      />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.projects.new.description", undefined, "Description")}
        </label>
        <textarea name="description" rows={4} maxLength={2000} className="ps-input mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.projects.new.startDate", undefined, "Start Date")} name="startDate" type="date" />
        <Input label={t("console.projects.new.endDate", undefined, "End Date")} name="endDate" type="date" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.projects.new.client", undefined, "Client")}
          </label>
          <select name="clientId" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">{t("console.projects.new.none", undefined, "— None —")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.projects.new.primaryVenue", undefined, "Primary Venue")}
          </label>
          <select name="primaryVenueId" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">{t("console.projects.new.none", undefined, "— None —")}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("console.projects.new.budgetUsd", undefined, "Budget — USD")}
        name="budget"
        type="number"
        min="0"
        step="0.01"
        placeholder={t("console.projects.new.budgetPlaceholder", undefined, "e.g. 1500000")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.projects.new.geographicScope", undefined, "Geographic Scope")}
          </label>
          <select name="geographicScope" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="local">{t("console.projects.new.scope.local", undefined, "Local")}</option>
            <option value="regional">{t("console.projects.new.scope.regional", undefined, "Regional")}</option>
            <option value="national">{t("console.projects.new.scope.national", undefined, "National")}</option>
            <option value="international">
              {t("console.projects.new.scope.international", undefined, "International")}
            </option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.projects.new.tourStructure", undefined, "Tour Structure")}
          </label>
          <select name="tourStructure" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="single_stop">{t("console.projects.new.tour.singleStop", undefined, "Single Stop")}</option>
            <option value="multi_stop_sequential">
              {t("console.projects.new.tour.multiStopSequential", undefined, "Multi-Stop Sequential")}
            </option>
            <option value="simultaneous_multi_city">
              {t("console.projects.new.tour.simultaneousMultiCity", undefined, "Simultaneous Multi-City")}
            </option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.projects.new.productionStyle", undefined, "Production Style")}
          </label>
          <select name="productionStyle" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="editorial">{t("console.projects.new.style.editorial", undefined, "Editorial")}</option>
            <option value="documentary">{t("console.projects.new.style.documentary", undefined, "Documentary")}</option>
            <option value="narrative">{t("console.projects.new.style.narrative", undefined, "Narrative")}</option>
            <option value="spectacle">{t("console.projects.new.style.spectacle", undefined, "Spectacle")}</option>
            <option value="intimate">{t("console.projects.new.style.intimate", undefined, "Intimate")}</option>
            <option value="brutalist">{t("console.projects.new.style.brutalist", undefined, "Brutalist")}</option>
          </select>
        </div>
      </div>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button href="/studio/projects" variant="ghost">
          {t("common.cancel", undefined, "Cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? t("console.projects.new.creating", undefined, "Creating…")
            : t("console.projects.new.createProject", undefined, "Create Project")}
        </Button>
      </div>
    </form>
  );
}
