import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createChange } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Operations" title="New change record" />
      <div className="page-content max-w-xl">
        <FormShell action={createChange} cancelHref="/console/ops/toc/changes" submitLabel="Create change">
          <Input label="Code" name="code" required maxLength={40} placeholder="CHG-001" />
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              className="input-base mt-1.5 w-full"
              placeholder="What is changing and why."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Type</label>
            <select name="type" defaultValue="normal" className="input-base mt-1.5 w-full">
              <option value="standard">Standard (pre-approved)</option>
              <option value="normal">Normal</option>
              <option value="emergency">Emergency</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Risk</label>
              <select name="risk" defaultValue="medium" className="input-base mt-1.5 w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Impact</label>
              <select name="impact" defaultValue="medium" className="input-base mt-1.5 w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <Input label="Planned start" name="planned_start" type="datetime-local" />
          <Input label="Planned end" name="planned_end" type="datetime-local" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Backout plan</label>
            <textarea
              name="backout_plan"
              rows={3}
              maxLength={4000}
              className="input-base mt-1.5 w-full"
              placeholder="How we revert if the change fails."
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
