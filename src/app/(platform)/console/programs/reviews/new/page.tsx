import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createReview } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Programs · Reviews" title="New Review" />
      <div className="page-content max-w-xl">
        <FormShell action={createReview} cancelHref="/console/programs/reviews" submitLabel="Schedule review">
          <Input label="Title" name="title" maxLength={200} placeholder="e.g. Mid-event ops sync" required />
          <Input label="Scheduled At" name="scheduled_at" type="datetime-local" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
