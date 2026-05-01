import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateContractor, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ contractorId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("workforce_members", session.orgId, p.contractorId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateContractor.bind(null, p.contractorId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Contractor"
        title={`Edit ${((row as Record<string, unknown>)["full_name"] as string | undefined) ?? "Contractor"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/contractors/${p.contractorId}`}
          submitLabel="Save Changes"
        >
          <Input label="Full Name" name="full_name" defaultValue={row.full_name ?? ""} required maxLength={200} />
          <Input label="Email" name="email" type="email" defaultValue={row.email ?? ""} />
          <Input label="Phone" name="phone" defaultValue={row.phone ?? ""} maxLength={40} />
          <Input label="Role" name="role" defaultValue={row.role ?? ""} maxLength={120} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Kind</span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="paid_staff">paid_staff</option>
              <option value="volunteer">volunteer</option>
              <option value="contractor">contractor</option>
              <option value="official">official</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
