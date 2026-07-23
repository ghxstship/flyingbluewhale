"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Certification } from "@/lib/legend_compliance";
import type { State } from "./actions";

/**
 * Create/edit form for a certification-type definition (name, code, validity
 * window, recert window). Mirrors the ResourceForm pattern: a thin client
 * island around FormShell + the server action.
 */
export function DefinitionForm({
  action,
  certification,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  certification?: Certification;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/legend/certifications/definitions" submitLabel={submitLabel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.certifications.definitions.form.code", undefined, "Code")}
          name="code"
          required
          maxLength={64}
          placeholder={t("console.legend.certifications.definitions.form.codePlaceholder", undefined, "RIG-L1")}
          defaultValue={certification?.code ?? ""}
        />
        <Input
          label={t("console.legend.certifications.definitions.form.name", undefined, "Name")}
          name="name"
          required
          maxLength={160}
          defaultValue={certification?.name ?? ""}
        />
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.certifications.definitions.form.description", undefined, "Description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={4000}
          defaultValue={certification?.description ?? ""}
          className="ps-input mt-1.5 w-full"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.certifications.definitions.form.validity", undefined, "Validity (months)")}
          name="validity_months"
          type="number"
          min={1}
          max={600}
          placeholder={t("console.legend.certifications.definitions.form.validityPlaceholder", undefined, "Blank = never expires")}
          defaultValue={certification?.validity_months ?? ""}
        />
        <Input
          label={t("console.legend.certifications.definitions.form.recertWindow", undefined, "Recert window (days before expiry)")}
          name="recert_window_days"
          type="number"
          required
          min={0}
          max={3650}
          defaultValue={certification?.recert_window_days ?? 30}
        />
      </div>
      <p className="text-xs text-[var(--p-text-3)]">
        {t(
          "console.legend.certifications.definitions.form.hint",
          undefined,
          "Holdings flip to Expiring once inside the recert window; a blank validity never expires.",
        )}
      </p>
    </FormShell>
  );
}
