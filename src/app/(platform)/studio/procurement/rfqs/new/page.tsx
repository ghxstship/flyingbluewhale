import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createRfqAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.rfqs.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.rfqs.new.title", undefined, "New RFQ")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRfqAction}
          cancelHref="/studio/procurement/rfqs"
          submitLabel={t("console.procurement.rfqs.new.submit", undefined, "Create RFQ")}
        >
          <Input
            label={t("console.procurement.rfqs.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.procurement.rfqs.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea id="description" name="description" rows={4} maxLength={4000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.procurement.rfqs.new.dueLabel", undefined, "Due")}
            name="due_at"
            type="datetime-local"
          />
        </FormShell>
      </div>
    </>
  );
}
