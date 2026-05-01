import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createProblem } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Operations" title="New problem record" />
      <div className="page-content max-w-xl">
        <FormShell action={createProblem} cancelHref="/console/ops/toc/problems" submitLabel="Create problem">
          <Input label="Code" name="code" required maxLength={40} placeholder="PRB-001" />
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              className="input-base mt-1.5 w-full"
              placeholder="The recurring symptom we're investigating."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Priority</label>
            <select name="priority" defaultValue="P3" className="input-base mt-1.5 w-full">
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — High</option>
              <option value="P3">P3 — Medium</option>
              <option value="P4">P4 — Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Workaround</label>
            <textarea
              name="workaround"
              rows={3}
              maxLength={4000}
              className="input-base mt-1.5 w-full"
              placeholder="Temporary mitigation while root cause is investigated."
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
