import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateCrewMember, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ crewId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("crew_members", session.orgId, p.crewId);
  if (!row) notFound();
  const action = updateCrewMember.bind(null, p.crewId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Crew" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/people/crew/${p.crewId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Role" name="role" defaultValue={row.role ?? ""} maxLength={120} />
          <Input label="Email" name="email" type="email" defaultValue={row.email ?? ""} />
          <Input label="Phone" name="phone" defaultValue={row.phone ?? ""} maxLength={40} />
          <Input
            label="Day Rate (Cents)"
            name="day_rate_cents"
            type="number"
            defaultValue={row.day_rate_cents != null ? String(row.day_rate_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={2000}
              className="input-base focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
