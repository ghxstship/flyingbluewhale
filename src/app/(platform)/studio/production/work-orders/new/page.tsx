import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { getRequestT } from "@/lib/i18n/request";
import { DISPATCH_MODES, DISPATCH_MODE_LABELS, WORK_ORDER_VISIBILITIES } from "@/lib/subcontractor";
import { createWorkOrderAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewWorkOrderPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.workOrders.new.eyebrow", undefined, "Production")}
        title={t("console.production.workOrders.new.title", undefined, "New Work Order")}
      />
      <div className="page-content max-w-xl">
        <FormShell action={createWorkOrderAction} submitLabel={t("console.production.workOrders.new.submit", undefined, "Create work order")}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.title", undefined, "Title")}</span>
            <input name="title" required maxLength={160} className="ps-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.trade", undefined, "Trade")}</span>
            <input name="trade" required maxLength={80} className="ps-input" placeholder="electrical, rigging, HVAC…" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.site", undefined, "Site address")}</span>
            <input name="site_address" maxLength={300} className="ps-input" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.start", undefined, "Start date")}</span>
              <input name="start_date" type="date" className="ps-input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.end", undefined, "End date")}</span>
              <input name="end_date" type="date" className="ps-input" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.budget", undefined, "Budget guide (USD)")}</span>
            <input name="budget_guide" type="number" min={0} step={1} className="ps-input" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.mode", undefined, "Dispatch mode")}</span>
              <select name="dispatch_mode" className="ps-input" defaultValue="allow-offers">
                {DISPATCH_MODES.map((m) => (
                  <option key={m} value={m}>
                    {DISPATCH_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("console.production.workOrders.field.visibility", undefined, "Visibility")}</span>
              <select name="visibility" className="ps-input" defaultValue="private">
                {WORK_ORDER_VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v === "private" ? "Private (internal)" : "Public (Trades Marketplace)"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
