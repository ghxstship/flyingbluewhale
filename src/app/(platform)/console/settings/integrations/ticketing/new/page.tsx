import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { TICKETING_PROVIDERS } from "@/lib/marketplace";
import { createTicketingConnectionAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="New Ticketing Connection" subtitle="Connect a ticketing provider." />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTicketingConnectionAction}
          cancelHref="/console/settings/integrations/ticketing"
          submitLabel="Connect"
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Provider</label>
            <select name="provider" className="input-base mt-1.5 w-full" required>
              {TICKETING_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <Input label="External Event ID (optional)" name="external_event_id" placeholder="evt_xxx" />
          <Input label="Label" name="label" placeholder="MMW26 mainstage on Etix" />
          <Input label="API Key (encrypted)" name="api_key" type="password" placeholder="••••" />
        </FormShell>
      </div>
    </>
  );
}
