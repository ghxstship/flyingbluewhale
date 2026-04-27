import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateEquipment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("equipment", session.orgId, p.equipmentId);
  if (!row) notFound();
  const action = updateEquipment.bind(null, p.equipmentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Equipment" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/production/equipment/${p.equipmentId}`}
          submitLabel="Save changes"
        >
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Category" name="category" defaultValue={row.category ?? ""} maxLength={120} />
          <Input label="Asset tag" name="asset_tag" defaultValue={row.asset_tag ?? ""} maxLength={80} />
          <Input label="Serial" name="serial" defaultValue={row.serial ?? ""} maxLength={120} />
          <Input
            label="Daily rate (cents)"
            name="daily_rate_cents"
            type="number"
            defaultValue={row.daily_rate_cents != null ? String(row.daily_rate_cents) : ""}
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
          <p className="text-xs text-[var(--text-muted)]">Status transitions are managed from the detail page.</p>
        </FormShell>
      </div>
    </>
  );
}
