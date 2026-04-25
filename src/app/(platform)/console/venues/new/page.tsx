import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createVenueAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Venues" title="New venue" />
      <div className="page-content max-w-xl">
        <FormShell action={createVenueAction} cancelHref="/console/venues" submitLabel="Create venue">
          <Input label="Name" name="name" required maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="competition" className="input-base mt-1.5 w-full">
              <option value="competition">Competition</option>
              <option value="training">Training</option>
              <option value="live_site">Live site</option>
              <option value="ibc">IBC</option>
              <option value="mpc">MPC</option>
              <option value="village">Village</option>
              <option value="support">Support</option>
            </select>
          </div>
          <Input label="Cluster" name="cluster" maxLength={80} />
          <Input label="Capacity" name="capacity" type="number" />
        </FormShell>
      </div>
    </>
  );
}
