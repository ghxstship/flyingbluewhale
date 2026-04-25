import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createAutomationAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Automations" title="New automation" />
      <div className="page-content max-w-xl">
        <FormShell action={createAutomationAction} cancelHref="/console/ai/automations" submitLabel="Create automation">
          <Input label="Name" name="name" required maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Trigger</label>
            <select name="trigger_kind" defaultValue="manual" className="input-base mt-1.5 w-full">
              <option value="manual">Manual</option>
              <option value="schedule">Schedule (cron)</option>
              <option value="webhook">Webhook</option>
              <option value="event">Event</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
