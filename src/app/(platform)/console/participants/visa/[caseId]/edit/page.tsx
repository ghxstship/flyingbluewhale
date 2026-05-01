import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateVisaCase, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("visa_cases", session.orgId, p.caseId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateVisaCase.bind(null, p.caseId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Visa Case"
        title={`Edit ${((row as Record<string, unknown>)["person_name"] as string | undefined) ?? "Visa case"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/participants/visa/${p.caseId}`} submitLabel="Save Changes">
          <Input label="Person Name" name="person_name" defaultValue={row.person_name ?? ""} required maxLength={200} />
          <Input label="Nationality" name="nationality" defaultValue={row.nationality ?? ""} maxLength={120} />
          <Input label="Passport #" name="passport_no" defaultValue={row.passport_no ?? ""} maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="pending">pending</option>
              <option value="submitted">submitted</option>
              <option value="approved">approved</option>
              <option value="denied">denied</option>
              <option value="expedited">expedited</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
