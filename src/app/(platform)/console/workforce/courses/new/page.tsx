import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCourseAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl">
        <FormShell action={createCourseAction} cancelHref="/console/workforce/courses" submitLabel="Create Course">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
            <textarea name="summary" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label="Duration (minutes)"
            name="duration_minutes"
            type="number"
            min="1"
            max="600"
            hint="Estimate; shown to the assignee on /m/learning."
          />
          <Input label="Required for role" name="required_for_role" maxLength={80} />
        </FormShell>
      </div>
    </>
  );
}
