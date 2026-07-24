"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { SESSION_KINDS, SESSION_KIND_LABELS, type LiveSession } from "@/lib/legend_live";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

/** ISO timestamp → the local `datetime-local` input value (YYYY-MM-DDTHH:mm). */
function toLocalInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SessionForm({
  action,
  liveSession,
  courses,
  hosts,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  liveSession?: LiveSession;
  courses: Array<{ id: string; title: string }>;
  hosts: Array<{ id: string; name: string }>;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/legend/teach/sessions" submitLabel={submitLabel}>
      <Input
        label={t("console.legend.teach.sessionForm.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={liveSession?.title ?? ""}
      />
      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.sessionForm.description", undefined, "Description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={4000}
          className="ps-input mt-1.5 w-full"
          defaultValue={liveSession?.description ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.teach.sessionForm.kind", undefined, "Kind")}
          </label>
          <select id="kind" name="kind" defaultValue={liveSession?.kind ?? "webinar"} className="ps-input mt-1.5 w-full">
            {SESSION_KINDS.map((k) => (
              <option key={k} value={k}>
                {SESSION_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="course_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.teach.sessionForm.course", undefined, "Linked course")}
          </label>
          <select
            id="course_id"
            name="course_id"
            defaultValue={liveSession?.course_id ?? ""}
            className="ps-input mt-1.5 w-full"
          >
            <option value="">{t("console.legend.teach.sessionForm.noCourse", undefined, "None")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={t("console.legend.teach.sessionForm.startsAt", undefined, "Starts")}
          name="starts_at"
          type="datetime-local"
          required
          defaultValue={toLocalInputValue(liveSession?.starts_at)}
        />
        <Input
          label={t("console.legend.teach.sessionForm.duration", undefined, "Duration (minutes)")}
          name="duration_minutes"
          type="number"
          min={1}
          max={1440}
          required
          defaultValue={String(liveSession?.duration_minutes ?? 60)}
        />
        <Input
          label={t("console.legend.teach.sessionForm.capacity", undefined, "Capacity")}
          name="capacity"
          type="number"
          min={1}
          defaultValue={liveSession?.capacity != null ? String(liveSession.capacity) : ""}
          hint={t("console.legend.teach.sessionForm.capacityHint", undefined, "Blank = unlimited. Overflow waitlists.")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="host_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.teach.sessionForm.host", undefined, "Host")}
          </label>
          <select id="host_id" name="host_id" defaultValue={liveSession?.host_id ?? ""} className="ps-input mt-1.5 w-full">
            <option value="">{t("console.legend.teach.sessionForm.noHost", undefined, "Unassigned")}</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.legend.teach.sessionForm.hostName", undefined, "Host display name")}
          name="host_name"
          maxLength={160}
          defaultValue={liveSession?.host_name ?? ""}
          hint={t("console.legend.teach.sessionForm.hostNameHint", undefined, "Shown to learners; use for guest hosts.")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.teach.sessionForm.location", undefined, "Location")}
          name="location"
          maxLength={300}
          defaultValue={liveSession?.location ?? ""}
        />
        <Input
          label={t("console.legend.teach.sessionForm.joinUrl", undefined, "Join URL")}
          name="join_url"
          type="url"
          placeholder="https://"
          defaultValue={liveSession?.join_url ?? ""}
        />
      </div>
    </FormShell>
  );
}
