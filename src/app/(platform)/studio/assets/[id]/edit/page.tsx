import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ASSET_CLASSES, ASSET_CLASS_LABELS, ASSET_DISPOSITIONS, ASSET_DISPOSITION_LABELS } from "@/lib/db/assets";
import type { Asset } from "@/lib/supabase/types";
import { updateAsset, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = (await getOrgScoped("assets", session.orgId, p.id)) as Asset | null;
  if (!row) notFound();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("org_id", session.orgId)
    .order("name", { ascending: true });
  const action = updateAsset.bind(null, p.id) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.edit.eyebrow", undefined, "Assets & Inventory")}
        title={t("console.assets.edit.title", { name: row.display_name }, `Edit ${row.display_name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/assets/${p.id}`}
          submitLabel={t("console.assets.edit.submit", undefined, "Save Changes")}
        >
          {/* Optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.assets.edit.fields.name", undefined, "Display Name")}
            name="display_name"
            defaultValue={row.display_name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.assets.edit.fields.kind", undefined, "Kind")}
            name="asset_kind"
            defaultValue={row.asset_kind}
            required
            maxLength={64}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.edit.fields.class", undefined, "Class")}
              </span>
              <select name="asset_class" required className="ps-input w-full" defaultValue={row.asset_class}>
                {ASSET_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {ASSET_CLASS_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={t("console.assets.edit.fields.qty", undefined, "Quantity")}
              name="qty"
              type="number"
              step="1"
              min="1"
              defaultValue={String(row.qty)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.edit.fields.disposition", undefined, "Disposition")}
              </span>
              <select name="disposition" className="ps-input w-full" defaultValue={row.disposition ?? ""}>
                <option value="">{t("console.assets.edit.dispositionNone", undefined, "None")}</option>
                {ASSET_DISPOSITIONS.map((d) => (
                  <option key={d} value={d}>
                    {ASSET_DISPOSITION_LABELS[d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.edit.fields.location", undefined, "Location")}
              </span>
              <select name="location_id" className="ps-input w-full" defaultValue={row.location_id ?? ""}>
                <option value="">{t("console.assets.edit.locationNone", undefined, "Unassigned")}</option>
                {(locations ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.assets.edit.fields.assetTag", undefined, "Asset Tag")}
              name="asset_tag"
              defaultValue={row.asset_tag ?? ""}
              maxLength={120}
            />
            <Input
              label={t("console.assets.edit.fields.serial", undefined, "Serial")}
              name="serial"
              defaultValue={row.serial ?? ""}
              maxLength={120}
            />
          </div>
          <Input
            label={t("console.assets.edit.fields.dailyRate", undefined, "Daily Rate in USD")}
            name="daily_rate_usd"
            type="number"
            step="0.01"
            min="0"
            defaultValue={row.daily_rate_minor != null ? String(row.daily_rate_minor / 100) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.assets.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={2000}
              className="ps-input focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.assets.edit.stateNote",
              undefined,
              "State transitions are managed from the detail page; every move writes the ledger.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
