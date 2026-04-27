import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateLead, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ leadId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("leads", session.orgId, p.leadId);
  if (!row) notFound();
  const action = updateLead.bind(null, p.leadId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Lead" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/leads/${p.leadId}`} submitLabel="Save changes">
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Email" name="email" type="email" defaultValue={row.email ?? ""} />
          <Input label="Phone" name="phone" defaultValue={row.phone ?? ""} maxLength={40} />
          <Input label="Source" name="source" defaultValue={row.source ?? ""} maxLength={120} />
          <Input
            label="Estimated value (cents)"
            name="estimated_value_cents"
            type="number"
            defaultValue={row.estimated_value_cents != null ? String(row.estimated_value_cents) : ""}
          />
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
          <p className="text-xs text-[var(--text-muted)]">Stage transitions are managed from the lead detail.</p>
        </FormShell>
      </div>
    </>
  );
}
