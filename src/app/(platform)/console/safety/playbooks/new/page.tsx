import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPlaybook } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety" title="New playbook" />
      <div className="page-content max-w-xl">
        <FormShell action={createPlaybook} cancelHref="/console/safety/playbooks" submitLabel="Create playbook">
          <div>
            <Input label="Slug" name="slug" maxLength={80} placeholder="evacuation-stadium-a" required />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Lowercase letters, digits, dashes. Used in the URL.
            </p>
          </div>
          <Input label="Title" name="title" maxLength={200} placeholder="Stadium A evacuation" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
            <textarea
              name="summary"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
              placeholder="One paragraph — when to invoke, who's accountable, what triggers it."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="general" className="input-base mt-1.5 w-full">
              <option value="crisis">Crisis</option>
              <option value="safety">Safety</option>
              <option value="onboarding">Onboarding</option>
              <option value="conops">ConOps</option>
              <option value="general">General</option>
            </select>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Body content (sections, steps, attachments) is authored on the playbook detail page after creation.
          </p>
        </FormShell>
      </div>
    </>
  );
}
