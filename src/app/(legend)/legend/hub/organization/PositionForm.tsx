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
};

export function PositionForm({
  action,
  departments,
  position,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  departments: Department[];
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
