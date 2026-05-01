import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCredential } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="People · Credentials" title="New Credential" />
      <div className="page-content max-w-xl">
        <FormShell action={createCredential} cancelHref="/console/people/credentials" submitLabel="Add Credential">
          <Input
            label="Kind"
            name="kind"
            maxLength={80}
            placeholder="e.g. First-aid, Working at height, SIA"
            required
          />
          <Input label="Number" name="number" maxLength={120} placeholder="Reference / serial" />
          <Input label="Issued On" name="issued_on" type="date" />
          <Input label="Expires On" name="expires_on" type="date" />
        </FormShell>
      </div>
    </>
  );
}
