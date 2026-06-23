import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { getRequestT } from "@/lib/i18n/request";
import { createCostCode } from "./actions";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.costCodes.new.title", undefined, "New Cost Code")}
      />
      <div className="page-content max-w-md">
        <FormShell
          action={createCostCode}
          cancelHref="/studio/finance/cost-codes"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.finance.costCodes.new.codeLabel", undefined, "Code")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input name="code" required placeholder="02-100" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.finance.costCodes.new.nameLabel", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.finance.costCodes.new.namePlaceholder", undefined, "Site Prep")}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.costCodes.new.descriptionLabel", undefined, "Description")}</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
