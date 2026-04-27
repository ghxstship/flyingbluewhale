import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createAccommodationBlock } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Accommodation" title="New Room Block" />
      <div className="page-content max-w-xl">
        <FormShell action={createAccommodationBlock} cancelHref="/console/accommodation/blocks" submitLabel="Create block">
          <Input label="Block Name" name="name" required maxLength={120} placeholder="e.g. Athletes Tier 1" />
          <Input label="Property" name="property" required maxLength={160} placeholder="Hotel / venue" />
          <Input label="City" name="city" maxLength={120} />
          <Input label="Stakeholder Group" name="stakeholder_group" maxLength={80} placeholder="e.g. delegations, sponsors, media" />
          <Input label="Rooms Reserved" name="rooms_reserved" type="number" min={0} defaultValue={0} required />
          <Input label="Starts On" name="starts_on" type="date" />
          <Input label="Ends On" name="ends_on" type="date" />
        </FormShell>
      </div>
    </>
  );
}
