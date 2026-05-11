import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createFlowAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Onboarding" title="New Flow" />
      <div className="page-content max-w-2xl">
        <FormShell action={createFlowAction} cancelHref="/console/workforce/onboarding" submitLabel="Create Flow">
          <Input label="Name" name="name" required maxLength={200} placeholder="Day-1 Crew Onboarding" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Target role" name="target_role" maxLength={80} placeholder="lighting-tech (optional)" />
        </FormShell>
      </div>
    </>
  );
}
