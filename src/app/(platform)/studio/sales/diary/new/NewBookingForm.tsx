"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { BOOKING_STATES, BOOKING_STATE_LABELS } from "@/lib/function_diary";
import { createBookingAction } from "../actions";

export type Option = { id: string; name: string };

export function NewBookingForm({
  spaces,
  projects,
  clients,
  defaultSpaceId,
}: {
  spaces: Option[];
  projects: Option[];
  clients: Option[];
  defaultSpaceId?: string;
}) {
  const t = useT();
  return (
    <FormShell
      action={createBookingAction}
      cancelHref="/studio/sales/diary"
      submitLabel={t("console.diary.new.submit", undefined, "Create Booking")}
    >
      <div>
        <label htmlFor="space_id" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.diary.field.space", undefined, "Space")}
        </label>
        <select id="space_id" name="space_id" required defaultValue={defaultSpaceId ?? ""} className="ps-input mt-1.5 w-full">
          <option value="" disabled>
            {t("console.diary.field.spacePlaceholder", undefined, "Select a space…")}
          </option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Input label={t("console.diary.field.title", undefined, "Title")} name="title" required maxLength={200} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.startsAt", undefined, "Starts at")}
          </label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="ps-input mt-1.5 w-full" />
        </div>
        <div>
          <label htmlFor="ends_at" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.endsAt", undefined, "Ends at")}
          </label>
          <input id="ends_at" name="ends_at" type="datetime-local" required className="ps-input mt-1.5 w-full" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="booking_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.state", undefined, "State")}
          </label>
          <select id="booking_state" name="booking_state" defaultValue="hold" className="ps-input mt-1.5 w-full">
            {BOOKING_STATES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.diary.field.headcount", undefined, "Headcount")}
          name="headcount"
          type="number"
          min={0}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.project", undefined, "Project (optional)")}
          </label>
          <select id="project_id" name="project_id" defaultValue="" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.diary.field.none", undefined, "None")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="client_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.client", undefined, "Client (optional)")}
          </label>
          <select id="client_id" name="client_id" defaultValue="" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.diary.field.none", undefined, "None")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.diary.field.notes", undefined, "Notes")}
        </label>
        <textarea id="notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
