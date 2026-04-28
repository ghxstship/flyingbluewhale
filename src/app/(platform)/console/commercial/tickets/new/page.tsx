import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTicketType } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Commercial · Tickets" title="New Ticket Type" />
      <div className="page-content max-w-xl">
        <FormShell action={createTicketType} cancelHref="/console/commercial/tickets" submitLabel="Add ticket type">
          <Input label="Name" name="name" maxLength={160} placeholder="e.g. General Admission, VIP, Comp" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Channel</label>
            <select name="channel" defaultValue="public" className="input-base mt-1.5 w-full">
              <option value="public">Public</option>
              <option value="comp">Comp</option>
              <option value="hospitality">Hospitality</option>
              <option value="press">Press</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <Input label="Price (cents)" name="price_cents" type="number" min={0} step={1} defaultValue={0} required />
          <Input
            label="Currency (ISO 4217)"
            name="currency"
            maxLength={3}
            placeholder="USD"
            defaultValue="USD"
            required
          />
          <Input label="Allocation" name="allocation" type="number" min={0} defaultValue={0} required />
        </FormShell>
      </div>
    </>
  );
}
