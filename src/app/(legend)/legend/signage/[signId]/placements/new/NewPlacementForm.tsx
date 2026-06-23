"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { PLACEMENT_STATES, PLACEMENT_STATE_LABELS } from "@/lib/legend_signage";
import { createPlacementAction } from "../../../actions";

export function NewPlacementForm({
  signId,
  projects,
}: {
  signId: string;
  projects: Array<{ id: string; name: string }>;
}) {
  return (
    <FormShell
      action={createPlacementAction}
      cancelHref={`/legend/signage/${signId}`}
      submitLabel="Record Placement"
    >
      <input type="hidden" name="sign_id" value={signId} />
      <Input label="Location" name="location" required maxLength={200} placeholder="Stage left, main corridor" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Quantity" name="quantity" type="number" min={0} defaultValue={1} />
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">State</span>
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
        <span className="text-xs font-medium text-[var(--p-text-2)]">Project (optional)</span>
        <select name="project_id" defaultValue="" className="ps-input mt-1.5 w-full">
          <option value="">— Org-level (no project) —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">Notes</span>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </label>
    </FormShell>
  );
}
