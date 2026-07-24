"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { PLACEMENT_STATES, PLACEMENT_STATE_LABELS } from "@/lib/legend_signage";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createPlacementAction } from "../../../actions";

export function NewPlacementForm({
  signId,
  projects,
}: {
  signId: string;
  projects: Array<{ id: string; name: string }>;
}) {
  const t = useT();
  return (
    <FormShell
      action={createPlacementAction}
      cancelHref={`/legend/signage/${signId}`}
      submitLabel={t("console.legend.signage.placement.submit", undefined, "Record Placement")}
    >
      <input type="hidden" name="sign_id" value={signId} />
      <Input
        label={t("console.legend.signage.placement.location", undefined, "Location")}
        name="location"
        required
        maxLength={200}
        placeholder={t("console.legend.signage.placement.locationPlaceholder", undefined, "Stage left, main corridor")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.signage.placement.quantity", undefined, "Quantity")}
          name="quantity"
          type="number"
          min={0}
          defaultValue={1}
        />
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.signage.placement.status", undefined, "Status")}
          </span>
          <select name="placement_state" defaultValue="planned" className="ps-input mt-1.5 w-full">
            {PLACEMENT_STATES.map((s) => (
              <option key={s} value={s}>
                {PLACEMENT_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.signage.placement.project", undefined, "Project (optional)")}
        </span>
        <select name="project_id" defaultValue="" className="ps-input mt-1.5 w-full">
          <option value="">{t("console.legend.signage.placement.orgLevel", undefined, "Org-level (no project)")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.signage.placement.notes", undefined, "Notes")}
        </span>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </label>
    </FormShell>
  );
}
