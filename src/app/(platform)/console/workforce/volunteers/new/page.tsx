import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createVolunteer } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Workforce · Volunteers" title="New Volunteer" />
      <div className="page-content max-w-xl">
        <FormShell action={createVolunteer} cancelHref="/console/workforce/volunteers" submitLabel="Add Volunteer">
          <Input label="Full Name" name="full_name" maxLength={200} required />
          <Input label="Email" name="email" type="email" />
          <Input label="Phone" name="phone" maxLength={40} />
          <Input label="Role" name="role" maxLength={120} placeholder="e.g. Wayfinding, Transport" />
        </FormShell>
      </div>
    </>
  );
}
