import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateDelegation, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ delegationId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("delegations", session.orgId, p.delegationId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateDelegation.bind(null, p.delegationId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Delegation"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Delegation"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/participants/delegations/${p.delegationId}`}
          submitLabel="Save Changes"
        >
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="Code" name="code" defaultValue={row.code ?? ""} required maxLength={40} />
          <Input label="Country" name="country" defaultValue={row.country ?? ""} maxLength={120} />
          <Input label="Contact Email" name="contact_email" type="email" defaultValue={row.contact_email ?? ""} />
          <Input label="Contact Phone" name="contact_phone" defaultValue={row.contact_phone ?? ""} maxLength={40} />
        </FormShell>
      </div>
    </>
  );
}
