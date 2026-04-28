import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createDelegation } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Participants · Delegations" title="New Delegation" />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDelegation}
          cancelHref="/console/participants/delegations"
          submitLabel="Add delegation"
        >
          <Input label="Code" name="code" maxLength={40} placeholder="e.g. USA, GBR" required />
          <Input label="Name" name="name" maxLength={160} placeholder="e.g. United States Olympic Team" required />
          <Input label="Country" name="country" maxLength={80} placeholder="ISO-3166 name" />
          <Input label="Contact Email" name="contact_email" type="email" placeholder="chef-de-mission@…" />
          <Input label="Contact Phone" name="contact_phone" maxLength={40} />
        </FormShell>
      </div>
    </>
  );
}
