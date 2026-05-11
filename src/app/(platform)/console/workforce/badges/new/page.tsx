import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createBadgeAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Badges" title="New Badge" />
      <div className="page-content max-w-xl">
        <FormShell action={createBadgeAction} cancelHref="/console/workforce/badges" submitLabel="Create">
          <Input
            label="Code"
            name="code"
            required
            maxLength={40}
            hint="Short identifier — lowercase, dashes ok."
            placeholder="safety-star"
          />
          <Input label="Name" name="name" required maxLength={80} placeholder="Safety Star" />
          <Input label="Icon (emoji)" name="icon" maxLength={4} placeholder="🛡️" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={400} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
