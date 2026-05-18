import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInspectionTemplateAction } from "./actions";

const CATEGORIES = [
  ["rigging", "Rigging"],
  ["fire", "Fire"],
  ["electrical", "Electrical"],
  ["ada", "ADA"],
  ["food_safety", "Food safety"],
  ["security", "Security"],
  ["foh", "FOH"],
  ["medical", "Medical"],
  ["sustainability", "Sustainability"],
  ["custom", "Custom"],
] as const;

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="New Inspection Template"
        subtitle="Reusable checklist that powers scheduled inspections."
        breadcrumbs={[
          { label: "Inspections", href: "/console/inspections" },
          { label: "Templates", href: "/console/inspections/templates" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createInspectionTemplateAction}
          cancelHref="/console/inspections/templates"
          submitLabel="Create Template"
          dirtyGuard
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Code"
              name="code"
              required
              maxLength={40}
              placeholder="RIG-PRE"
              hint="Short slug — uppercase, dashes ok. Used on inspection records."
              className="uppercase"
            />
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Category <span className="text-[var(--color-error)]">*</span>
              </label>
              <select name="category" required defaultValue="custom" className="input-base mt-1.5 w-full">
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input label="Name" name="name" required maxLength={200} placeholder="Pre-show rigging walk" />

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
              placeholder="When to run, who runs it, what passing means."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Checklist items</label>
            <textarea
              name="items"
              rows={10}
              maxLength={20000}
              className="input-base mt-1.5 w-full font-mono text-xs"
              placeholder={`One prompt per line, e.g.\nGround support legs plumb\nMotor chains free of obstructions\nLoad cells calibrated within 30 days`}
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Each line becomes a checklist item. Up to 200 items. Per-item options (photo required, etc.) editable
              after creation.
            </p>
          </div>
        </FormShell>
      </div>
    </>
  );
}
