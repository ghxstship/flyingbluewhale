import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCrisisAlertAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Crisis" title="New alert" />
      <div className="page-content max-w-xl">
        <FormShell
          action={createCrisisAlertAction}
          cancelHref="/console/safety/crisis"
          submitLabel="Send alert"
        >
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body</label>
            <textarea
              name="body"
              rows={4}
              required
              maxLength={4000}
              className="input-base mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select name="severity" defaultValue="info" className="input-base mt-1.5 w-full">
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
