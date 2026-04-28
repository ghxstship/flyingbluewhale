import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateClient, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("clients", session.orgId, p.clientId);
  if (!row) notFound();
  const action = updateClient.bind(null, p.clientId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Client" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/clients/${p.clientId}`} submitLabel="Save changes">
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Email" name="contact_email" type="email" defaultValue={row.contact_email ?? ""} />
          <Input label="Phone" name="contact_phone" defaultValue={row.contact_phone ?? ""} maxLength={40} />
          <Input label="Website" name="website" defaultValue={row.website ?? ""} maxLength={300} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
