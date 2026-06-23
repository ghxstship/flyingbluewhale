import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createVenueAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.new.eyebrow", undefined, "Venues")}
        title={t("console.venues.new.title", undefined, "New Venue")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createVenueAction}
          cancelHref="/studio/venues"
          submitLabel={t("console.venues.new.submit", undefined, "Create Venue")}
        >
          <Input label={t("console.venues.new.name", undefined, "Name")} name="name" required maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.venues.new.kind", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="competition" className="ps-input mt-1.5 w-full">
              <option value="competition">{t("console.venues.new.kindCompetition", undefined, "Competition")}</option>
              <option value="training">{t("console.venues.new.kindTraining", undefined, "Training")}</option>
              <option value="live_site">{t("console.venues.new.kindLiveSite", undefined, "Live site")}</option>
              <option value="ibc">{t("console.venues.new.kindIbc", undefined, "IBC")}</option>
              <option value="mpc">{t("console.venues.new.kindMpc", undefined, "MPC")}</option>
              <option value="village">{t("console.venues.new.kindVillage", undefined, "Village")}</option>
              <option value="support">{t("console.venues.new.kindSupport", undefined, "Support")}</option>
            </select>
          </div>
          <Input label={t("console.venues.new.cluster", undefined, "Cluster")} name="cluster" maxLength={80} />
          <Input label={t("console.venues.new.capacity", undefined, "Capacity")} name="capacity" type="number" />
        </FormShell>
      </div>
    </>
  );
}
