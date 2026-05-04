import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateHospitalityPackage, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ packageId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rate_card_items", session.orgId, p.packageId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateHospitalityPackage.bind(null, p.packageId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Hospitality Package"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Hospitality package"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/commercial/hospitality/${p.packageId}`}
          submitLabel="Save Changes"
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="SKU" name="sku" defaultValue={row.sku ?? ""} required maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label="Unit Price (Cents)"
            name="unit_price_cents"
            type="number"
            defaultValue={row.unit_price_cents != null ? String(row.unit_price_cents) : ""}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? ""} required maxLength={3} />
        </FormShell>
      </div>
    </>
  );
}
