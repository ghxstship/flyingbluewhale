import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createSurveyAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Surveys" title="New Survey" />
      <div className="page-content max-w-2xl">
        <FormShell action={createSurveyAction} cancelHref="/console/comms/surveys" submitLabel="Create">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
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
            <input type="checkbox" name="anonymous" /> Anonymous responses
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="publish_now" /> Publish immediately
          </label>
        </FormShell>
      </div>
    </>
  );
}
