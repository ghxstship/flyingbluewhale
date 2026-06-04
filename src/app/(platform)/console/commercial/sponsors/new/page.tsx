import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createEntitlement } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.commercial.sponsors.new.eyebrow", undefined, "Commercial · Sponsors")}
        title={t("console.commercial.sponsors.new.title", undefined, "New Entitlement")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createEntitlement}
          cancelHref="/console/commercial/sponsors"
          submitLabel={t("console.commercial.sponsors.new.submit", undefined, "Add Entitlement")}
        >
          <Input
            label={t("console.commercial.sponsors.new.fields.title", undefined, "Title")}
            name="title"
            maxLength={160}
            placeholder={t(
              "console.commercial.sponsors.new.fields.titlePlaceholder",
              undefined,
              "e.g. Tier-1 hospitality (8 guests)",
            )}
            required
          />
          <Input
            label={t("console.commercial.sponsors.new.fields.quantity", undefined, "Quantity")}
            name="quantity"
            type="number"
            min={0}
            max={1000000}
            defaultValue={1}
            required
          />
          <Input
            label={t("console.commercial.sponsors.new.fields.dueBy", undefined, "Due By")}
            name="due_by"
            type="date"
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.commercial.sponsors.new.fields.status", undefined, "Status")}
            </label>
            <select name="status" defaultValue="open" className="input-base mt-1.5 w-full">
              <option value="open">{t("console.commercial.sponsors.new.status.open", undefined, "Open")}</option>
              <option value="in_progress">
                {t("console.commercial.sponsors.new.status.inProgress", undefined, "In progress")}
              </option>
              <option value="delivered">
                {t("console.commercial.sponsors.new.status.delivered", undefined, "Delivered")}
              </option>
              <option value="waived">{t("console.commercial.sponsors.new.status.waived", undefined, "Waived")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
