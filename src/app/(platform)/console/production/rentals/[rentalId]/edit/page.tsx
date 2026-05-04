import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateRental, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ rentalId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rentals", session.orgId, p.rentalId);
  if (!row) notFound();
  const action = updateRental.bind(null, p.rentalId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Rental" title="Edit Rental" />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/production/rentals/${p.rentalId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label="Starts At"
            name="starts_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.starts_at)}
            required
          />
          <Input
            label="Ends At"
            name="ends_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ends_at)}
            required
          />
          <Input
            label="Rate (cents)"
            name="rate_cents"
            type="number"
            defaultValue={row.rate_cents != null ? String(row.rate_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">To change equipment or project, delete and recreate.</p>
        </FormShell>
      </div>
    </>
  );
}
