import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateHospitalityPackage, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ packageId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const row = await getOrgScoped("rate_card_items", session.orgId, p.packageId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateHospitalityPackage.bind(null, p.packageId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const fallbackName = t("console.commercial.hospitality.edit.fallbackName", undefined, "Hospitality package");
  const packageName = ((row as Record<string, unknown>)["name"] as string | undefined) ?? fallbackName;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.commercial.hospitality.edit.eyebrow", undefined, "Hospitality Package")}
        title={t("console.commercial.hospitality.edit.title", { name: packageName }, `Edit ${packageName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/commercial/hospitality/${p.packageId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.commercial.hospitality.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.commercial.hospitality.edit.fields.sku", undefined, "SKU")}
            name="sku"
            defaultValue={row.sku ?? ""}
            required
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.commercial.hospitality.edit.fields.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.commercial.hospitality.edit.fields.unitPriceCents", undefined, "Unit Price — Cents")}
            name="unit_price_cents"
            type="number"
            defaultValue={row.unit_price_cents != null ? String(row.unit_price_cents) : ""}
          />
          <Input
            label={t("console.commercial.hospitality.edit.fields.currency", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? ""}
            required
            maxLength={3}
          />
        </FormShell>
      </div>
    </>
  );
}
