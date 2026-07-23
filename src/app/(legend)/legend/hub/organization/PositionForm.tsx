"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export type Department = { code: string; label: string };

export type PositionRow = {
  id: string;
  title: string;
  department_code: string | null;
  summary: string | null;
  active: boolean;
  reports_to_position_id: string | null;
  seat_count: number;
};

/** Eligible reports-to targets — the server excludes self + descendants. */
export type ReportsToOption = { id: string; title: string };

export function PositionForm({
  action,
  departments,
  reportsToOptions,
  position,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  departments: Department[];
  reportsToOptions: ReportsToOption[];
  position?: PositionRow;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/legend/hub/organization" submitLabel={submitLabel}>
      <Input
        label={t("console.legend.hub.organization.form.title", undefined, "Title")}
        name="title"
        required
        maxLength={120}
        defaultValue={position?.title ?? ""}
      />

      <div>
        <label htmlFor="department_code" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.hub.organization.form.department", undefined, "Department")}
        </label>
        <select
          id="department_code"
          name="department_code"
          defaultValue={position?.department_code ?? ""}
          className="ps-input mt-1.5 w-full"
        >
          <option value="">{t("console.legend.hub.organization.form.unclassified", undefined, "Unclassified")}</option>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} · {d.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--p-text-3)]">
          {t(
            "console.legend.hub.organization.form.departmentHint",
            undefined,
            "The XPMS department class this position belongs to.",
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor="reports_to_position_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.hub.organization.form.reportsTo", undefined, "Reports to")}
          </label>
          <select
            id="reports_to_position_id"
            name="reports_to_position_id"
            defaultValue={position?.reports_to_position_id ?? ""}
            className="ps-input mt-1.5 w-full"
          >
            <option value="">
              {t("console.legend.hub.organization.form.reportsToNone", undefined, "No one (top of the chart)")}
            </option>
            {reportsToOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--p-text-3)]">
            {t(
              "console.legend.hub.organization.form.reportsToHint",
              undefined,
              "Where this position sits on the org chart. A position cannot report into its own subtree.",
            )}
          </p>
        </div>
        <Input
          label={t("console.legend.hub.organization.form.seats", undefined, "Seats")}
          name="seat_count"
          type="number"
          min={1}
          max={500}
          required
          defaultValue={String(position?.seat_count ?? 1)}
        />
      </div>

      <div>
        <label htmlFor="summary" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.hub.organization.form.summary", undefined, "Summary")}
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          maxLength={2000}
          className="ps-input mt-1.5 w-full"
          defaultValue={position?.summary ?? ""}
          placeholder={t(
            "console.legend.hub.organization.form.summaryPlaceholder",
            undefined,
            "What this position owns and who it reports to.",
          )}
        />
      </div>
    </FormShell>
  );
}
