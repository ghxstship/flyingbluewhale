"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { BOOKING_STATES, BOOKING_STATE_LABELS } from "@/lib/function_diary";
import { updateBookingAction, type State } from "../../actions";
import type { Option } from "../../new/NewBookingForm";

/** Format an ISO timestamp for an <input type="datetime-local"> value (local). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditBookingForm({
  bookingId,
  spaces,
  projects,
  clients,
  initial,
}: {
  bookingId: string;
  spaces: Option[];
  projects: Option[];
  clients: Option[];
  initial: {
    space_id: string;
    project_id: string | null;
    client_id: string | null;
    title: string;
    starts_at: string;
    ends_at: string;
    booking_state: string;
    headcount: number | null;
    notes: string | null;
  };
}) {
  const t = useT();
  const action = (prev: State, fd: FormData) => updateBookingAction(bookingId, prev, fd);
  return (
    <FormShell
      action={action}
      cancelHref={`/studio/sales/diary/${bookingId}`}
      submitLabel={t("console.diary.edit.submit", undefined, "Save Booking")}
    >
      <div>
        <label htmlFor="space_id" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.diary.field.space", undefined, "Space")}
        </label>
        <select id="space_id" name="space_id" required defaultValue={initial.space_id} className="ps-input mt-1.5 w-full">
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label={t("console.diary.field.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        defaultValue={initial.title}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.startsAt", undefined, "Starts at")}
          </label>
          <input id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toLocalInput(initial.starts_at)}
            className="ps-input mt-1.5 w-full"
          />
        </div>
        <div>
          <label htmlFor="ends_at" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.endsAt", undefined, "Ends at")}
          </label>
          <input id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            defaultValue={toLocalInput(initial.ends_at)}
            className="ps-input mt-1.5 w-full"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="booking_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.state", undefined, "State")}
          </label>
          <select id="booking_state" name="booking_state" defaultValue={initial.booking_state} className="ps-input mt-1.5 w-full">
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
          defaultValue={initial.headcount ?? undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.diary.field.project", undefined, "Project (optional)")}
          </label>
          <select id="project_id" name="project_id" defaultValue={initial.project_id ?? ""} className="ps-input mt-1.5 w-full">
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
          <select id="client_id" name="client_id" defaultValue={initial.client_id ?? ""} className="ps-input mt-1.5 w-full">
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
        <textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ""} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
