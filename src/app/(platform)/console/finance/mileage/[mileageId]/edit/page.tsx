import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateMileage, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ mileageId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("mileage_logs", session.orgId, p.mileageId);
  if (!row) notFound();
  const action = updateMileage.bind(null, p.mileageId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Mileage Log" title={`Edit ${row.origin} → ${row.destination}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/finance/mileage/${p.mileageId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Origin" name="origin" defaultValue={row.origin} required maxLength={200} />
          <Input label="Destination" name="destination" defaultValue={row.destination} required maxLength={200} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Miles" name="miles" type="number" step="any" defaultValue={String(row.miles ?? 0)} />
            <Input
              label="Rate (cents/mile)"
              name="rate_cents"
              type="number"
              defaultValue={String(row.rate_cents ?? 0)}
            />
          </div>
          <Input label="Logged On" name="logged_on" type="date" defaultValue={dateOnly(row.logged_on)} required />
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
