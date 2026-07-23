import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createAdManifest } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.ad.new.eyebrow", undefined, "Transport")}
        title={t("console.transport.ad.new.title", undefined, "New A&D Manifest")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createAdManifest}
          cancelHref="/studio/transport/ad"
          submitLabel={t("console.transport.ad.new.submit", undefined, "Add Manifest")}
        >
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.ad.new.direction", undefined, "Direction")}
            </label>
            <select id="kind" name="kind" defaultValue="arrival" className="ps-input mt-1.5 w-full">
              <option value="arrival">{t("console.transport.ad.new.arrival", undefined, "Arrival")}</option>
              <option value="departure">{t("console.transport.ad.new.departure", undefined, "Departure")}</option>
            </select>
          </div>
          <Input
            label={t("console.transport.ad.new.flightRef", undefined, "Flight Reference")}
            name="flight_ref"
            maxLength={80}
            placeholder={t("console.transport.ad.new.flightRefPlaceholder", undefined, "e.g. AA1234")}
          />
          <Input
            label={t("console.transport.ad.new.carrier", undefined, "Carrier")}
            name="carrier"
            maxLength={80}
            placeholder={t("console.transport.ad.new.carrierPlaceholder", undefined, "e.g. American Airlines")}
          />
          <Input
            label={t("console.transport.ad.new.scheduledAt", undefined, "Scheduled Time")}
            name="scheduled_at"
            type="datetime-local"
          />
          <Input
            label={t("console.transport.ad.new.partySize", undefined, "Party Size")}
            name="party_size"
            type="number"
            min={1}
            max={2000}
            defaultValue={1}
            required
          />
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.ad.new.notes", undefined, "Notes")}
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
