import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createStaff } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Workforce · Staff" title="New Staff Member" />
      <div className="page-content max-w-xl">
        <FormShell action={createStaff} cancelHref="/console/workforce/staff" submitLabel="Add Staff">
          <Input label="Full Name" name="full_name" maxLength={200} required />
          <Input label="Email" name="email" type="email" />
          <Input label="Phone" name="phone" maxLength={40} />
          <Input label="Role" name="role" maxLength={120} placeholder="e.g. Production Manager, Steward Lead" />
        </FormShell>
      </div>
    </>
  );
}
