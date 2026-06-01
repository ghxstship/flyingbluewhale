import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createOvertimeRuleAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Settings · Overtime" title="New Overtime Rule" />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createOvertimeRuleAction}
          cancelHref="/console/settings/overtime-rules"
          submitLabel="Create Rule"
        >
          <Input label="Rule name" name="name" required maxLength={200} placeholder="e.g. California 8/12 Rule" />

          <fieldset className="space-y-3 rounded-md border border-[var(--border-color)] p-3">
            <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
              Daily thresholds
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="OT after (hours/day)"
                name="daily_ot_after_hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                defaultValue="8"
              />
              <Input
                label="DT after (hours/day)"
                name="daily_dt_after_hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                hint="Leave blank if no daily DT."
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-md border border-[var(--border-color)] p-3">
            <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
              Weekly threshold
            </legend>
            <Input
              label="OT after (hours/week)"
              name="weekly_ot_after_hours"
              type="number"
              min="0"
              max="168"
              defaultValue="40"
            />
          </fieldset>

          <fieldset className="space-y-3 rounded-md border border-[var(--border-color)] p-3">
            <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
              Pay multipliers
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Input label="OT multiplier" name="ot_multiplier" type="number" min="1" max="5" step="0.25" defaultValue="1.5" />
              <Input
                label="DT multiplier"
                name="dt_multiplier"
                type="number"
                min="1"
                max="5"
                step="0.25"
                defaultValue="2.0"
                hint="Leave blank if no DT."
              />
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="seventh_day_rule" /> Apply 7th-day OT rule (CA)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="is_default" /> Set as org default
          </label>
        </FormShell>
      </div>
    </>
  );
}
