"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SCHEDULE_EVENT_KINDS, SCHEDULE_EVENT_KIND_LABELS } from "@/lib/schedule/kinds";
import { createEventAction } from "../actions";

export function NewEventForm({
  projects,
  locations,
}: {
  projects: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <FormShell
      action={createEventAction}
      cancelHref="/studio/events"
      submitLabel={t("console.events.new.submit", undefined, "Create Event")}
    >
      <Input label={t("console.events.new.nameLabel", undefined, "Name")} name="name" required />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.events.new.typeLabel", undefined, "Type")}
        </label>
        {/* Meetings enter through /studio/meetings/new so the details sibling
            (MTG code, agenda, meeting URL) is always created alongside. */}
        <select name="event_kind" defaultValue="general" className="ps-input mt-1.5 w-full">
          {SCHEDULE_EVENT_KINDS.filter((k) => k !== "meeting").map((k) => (
            <option key={k} value={k}>
              {SCHEDULE_EVENT_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.events.new.startsLabel", undefined, "Starts")}
          name="starts_at"
          type="datetime-local"
          required
        />
        <Input
          label={t("console.events.new.endsLabel", undefined, "Ends")}
          name="ends_at"
          type="datetime-local"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.events.new.projectLabel", undefined, "Project")}
          </label>
          <select name="project_id" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.events.new.noProject", undefined, "— No project —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.events.new.locationLabel", undefined, "Location")}
          </label>
          <select name="location_id" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.events.new.noLocation", undefined, "— No location —")}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.events.new.descriptionLabel", undefined, "Description")}
        </label>
        <textarea name="description" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
