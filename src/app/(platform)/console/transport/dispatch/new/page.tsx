import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createDispatchRun } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.dispatch.new.eyebrow", undefined, "Transport")}
        title={t("console.transport.dispatch.new.title", undefined, "New Dispatch Run")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDispatchRun}
          cancelHref="/console/transport/dispatch"
          submitLabel={t("console.transport.dispatch.new.submit", undefined, "Schedule Run")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.transport.dispatch.new.fleetLabel", undefined, "Fleet")}
            </label>
            <select name="fleet" defaultValue="t1" className="input-base mt-1.5 w-full">
              <option value="t1">{t("console.transport.dispatch.new.fleet.t1", undefined, "T1 — Athletes")}</option>
              <option value="t2">{t("console.transport.dispatch.new.fleet.t2", undefined, "T2 — Teams")}</option>
              <option value="t3">
                {t("console.transport.dispatch.new.fleet.t3", undefined, "T3 — Olympic Family")}
              </option>
              <option value="media">{t("console.transport.dispatch.new.fleet.media", undefined, "Media")}</option>
              <option value="workforce">
                {t("console.transport.dispatch.new.fleet.workforce", undefined, "Workforce")}
              </option>
              <option value="spectator">
                {t("console.transport.dispatch.new.fleet.spectator", undefined, "Spectator")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.transport.dispatch.new.vehicleRefLabel", undefined, "Vehicle Reference")}
            name="vehicle_ref"
            maxLength={80}
            placeholder={t("console.transport.dispatch.new.vehicleRefPlaceholder", undefined, "e.g. Bus 14, Van 03")}
          />
          <Input
            label={t("console.transport.dispatch.new.scheduledDepartLabel", undefined, "Scheduled Departure")}
            name="scheduled_depart"
            type="datetime-local"
            required
          />
          <Input
            label={t("console.transport.dispatch.new.scheduledArriveLabel", undefined, "Scheduled Arrival")}
            name="scheduled_arrive"
            type="datetime-local"
          />
        </FormShell>
      </div>
    </>
  );
}
