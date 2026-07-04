import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ASSET_CLASSES, ASSET_CLASS_LABELS, ASSET_DISPOSITIONS, ASSET_DISPOSITION_LABELS } from "@/lib/db/assets";
import { createAsset } from "./actions";

const OWNERSHIPS = ["owned", "leased", "rented", "sub_hired"] as const;

export default async function Page() {
  const { t } = await getRequestT();
  let locations: Array<{ id: string; name: string }> = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true });
    locations = data ?? [];
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.new.eyebrow", undefined, "Assets & Inventory")}
        title={t("console.assets.new.title", undefined, "New Asset")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createAsset}
          cancelHref="/studio/assets"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.assets.new.displayNameLabel", undefined, "Display name")}
            name="display_name"
            required
            maxLength={200}
            placeholder="Comms · Radio R7 #12"
            hint={t("console.assets.new.displayNameHint", undefined, "Asset naming: Category · Type.")}
          />
          <Input
            label={t("console.assets.new.assetKindLabel", undefined, "Asset kind")}
            name="asset_kind"
            required
            maxLength={64}
            placeholder="microphone"
            hint={t(
              "console.assets.new.assetKindHint",
              undefined,
              "Free-form category, e.g. microphone, truck, radio.",
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.new.classLabel", undefined, "Class")}
              </label>
              <select name="asset_class" required className="ps-input mt-1.5 w-full" defaultValue="gear">
                {ASSET_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {ASSET_CLASS_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.assets.new.qtyLabel", undefined, "Quantity")}
              name="qty"
              type="number"
              step="1"
              min="1"
              defaultValue="1"
              hint={t("console.assets.new.qtyHint", undefined, "Lots carry counts; serialized gear stays at 1.")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.new.ownershipLabel", undefined, "Ownership")}
              </label>
              <select name="ownership" required className="ps-input mt-1.5 w-full" defaultValue="owned">
                {OWNERSHIPS.map((o) => (
                  <option key={o} value={o}>
                    {t(`console.assets.ownership.${o}`, undefined, o.replace(/_/g, " "))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.new.dispositionLabel", undefined, "Disposition")}
              </label>
              <select name="disposition" className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="">{t("console.assets.new.dispositionNone", undefined, "None")}</option>
                {ASSET_DISPOSITIONS.map((d) => (
                  <option key={d} value={d}>
                    {ASSET_DISPOSITION_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {locations.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.new.locationLabel", undefined, "Location")}
              </label>
              <select name="location_id" className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="">{t("console.assets.new.locationNone", undefined, "Unassigned")}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("console.assets.new.serialLabel", undefined, "Serial")} name="serial" maxLength={120} />
            <Input
              label={t("console.assets.new.assetTagLabel", undefined, "Asset tag")}
              name="asset_tag"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.assets.new.acquisitionCostLabel", undefined, "Acquisition cost in USD")}
              name="acquisition_cost_usd"
              type="number"
              step="0.01"
              min="0"
            />
            <Input
              label={t("console.assets.new.dailyRateLabel", undefined, "Daily rate in USD")}
              name="daily_rate_usd"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          <Input
            label={t("console.assets.new.acquiredAtLabel", undefined, "Acquired")}
            name="acquired_at"
            type="date"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.assets.new.notesLabel", undefined, "Notes")}
            </label>
            <textarea name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
