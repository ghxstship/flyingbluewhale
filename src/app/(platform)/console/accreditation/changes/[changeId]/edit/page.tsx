import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateAccreditationChange, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ changeId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("accreditation_changes", session.orgId, p.changeId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateAccreditationChange.bind(null, p.changeId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation Change"
        title={`Edit ${((row as Record<string, unknown>)["kind"] as string | undefined) ?? "Accreditation change"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/accreditation/changes/${p.changeId}`}
          submitLabel="Save Changes"
        >
          <Input label="Kind" name="kind" defaultValue={row.kind ?? ""} required maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="applied">applied</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Note</span>
            <textarea name="note" defaultValue={row.note ?? ""} rows={5} className="input-base focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
