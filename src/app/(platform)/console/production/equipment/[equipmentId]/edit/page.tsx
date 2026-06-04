import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateEquipment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("equipment", session.orgId, p.equipmentId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateEquipment.bind(null, p.equipmentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.edit.eyebrow", undefined, "Equipment")}
        title={t("console.production.equipment.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/production/equipment/${p.equipmentId}`}
          submitLabel={t("console.production.equipment.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.production.equipment.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.production.equipment.edit.fields.category", undefined, "Category")}
            name="category"
            defaultValue={row.category ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.production.equipment.edit.fields.assetTag", undefined, "Asset Tag")}
            name="asset_tag"
            defaultValue={row.asset_tag ?? ""}
            maxLength={80}
          />
          <Input
            label={t("console.production.equipment.edit.fields.serial", undefined, "Serial")}
            name="serial"
            defaultValue={row.serial ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.production.equipment.edit.fields.dailyRateCents", undefined, "Daily Rate (Cents)")}
            name="daily_rate_cents"
            type="number"
            defaultValue={row.daily_rate_cents != null ? String(row.daily_rate_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.production.equipment.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={2000}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            {t(
              "console.production.equipment.edit.statusNote",
              undefined,
              "Status transitions are managed from the detail page.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
