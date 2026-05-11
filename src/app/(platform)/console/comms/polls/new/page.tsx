import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPollAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Polls" title="New Poll" />
      <div className="page-content max-w-2xl">
        <FormShell action={createPollAction} cancelHref="/console/comms/polls" submitLabel="Create">
          <Input label="Question" name="question" required maxLength={300} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Options (one per line, max 8)</label>
            <textarea
              name="options"
              rows={6}
              required
              placeholder="Yes&#10;No&#10;Unsure"
              className="input-base mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Audience</label>
            <select name="audience" className="input-base mt-1.5 w-full" defaultValue="all">
              <option value="all">All</option>
              <option value="crew">Crew</option>
              <option value="contractors">Contractors</option>
              <option value="vendors">Vendors</option>
              <option value="admins">Admins</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="publish_now" defaultChecked /> Go live immediately
          </label>
        </FormShell>
      </div>
    </>
  );
}
