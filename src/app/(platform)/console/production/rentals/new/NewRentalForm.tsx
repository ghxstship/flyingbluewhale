"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createRentalAction } from "../actions";

export function NewRentalForm({
  equipment,
  projects,
}: {
  equipment: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <FormShell
      action={createRentalAction}
      cancelHref="/console/production/rentals"
      submitLabel={t("console.production.rentals.new.submit", undefined, "Reserve")}
    >
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.production.rentals.new.equipmentLabel", undefined, "Equipment")}
        </label>
        <select name="equipment_id" className="input-base mt-1.5 w-full" required>
          <option value="">
            {t("console.production.rentals.new.equipmentPlaceholder", undefined, "Select equipment")}
          </option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.production.rentals.new.startsLabel", undefined, "Starts")}
          name="starts_at"
          type="datetime-local"
          required
        />
        <Input
          label={t("console.production.rentals.new.endsLabel", undefined, "Ends")}
          name="ends_at"
          type="datetime-local"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.production.rentals.new.projectLabel", undefined, "Project")}
          </label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">{t("console.production.rentals.new.projectNone", undefined, "— No project —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.production.rentals.new.rateLabel", undefined, "Rate (USD)")}
          name="rate"
          type="number"
          step="0.01"
        />
      </div>
    </FormShell>
  );
}
