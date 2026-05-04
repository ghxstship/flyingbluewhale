import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateVendor, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("vendors", session.orgId, p.vendorId);
  if (!row) notFound();
  const action = updateVendor.bind(null, p.vendorId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Vendor" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/procurement/vendors/${p.vendorId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Category" name="category" defaultValue={row.category ?? ""} maxLength={120} />
          <Input label="Contact Email" name="contact_email" type="email" defaultValue={row.contact_email ?? ""} />
          <Input label="Contact Phone" name="contact_phone" defaultValue={row.contact_phone ?? ""} maxLength={40} />
          <Input label="COI expires on" name="coi_expires_at" type="date" defaultValue={dateOnly(row.coi_expires_at)} />
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
        </FormShell>
      </div>
    </>
  );
}
