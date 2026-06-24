import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createAsset } from "./actions";

const OWNERSHIPS = ["owned", "leased", "rented", "sub_hired"] as const;

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.new.eyebrow", undefined, "Assets")}
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
            placeholder="Shure SM58 — #014"
          />
          <Input
            label={t("console.assets.new.assetKindLabel", undefined, "Asset kind")}
            name="asset_kind"
            required
            maxLength={64}
            placeholder="microphone"
            hint={t("console.assets.new.assetKindHint", undefined, "Free-form category, e.g. microphone, truck, radio.")}
          />
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.assets.new.serialLabel", undefined, "Serial")}
              name="serial"
              maxLength={120}
            />
            <Input
              label={t("console.assets.new.assetTagLabel", undefined, "Asset tag")}
              name="asset_tag"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.assets.new.acquisitionCostLabel", undefined, "Acquisition cost — USD")}
              name="acquisition_cost_usd"
              type="number"
              step="0.01"
              min="0"
            />
            <Input
              label={t("console.assets.new.dailyRateLabel", undefined, "Daily rate — USD")}
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
        </FormShell>
      </div>
    </>
  );
}
