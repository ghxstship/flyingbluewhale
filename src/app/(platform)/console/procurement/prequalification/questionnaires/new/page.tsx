import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { getRequestT } from "@/lib/i18n/request";
import { createQuestionnaire } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.prequalification.questionnaires.new.eyebrow", undefined, "Procurement")}
        breadcrumbs={[
          {
            label: t(
              "console.procurement.prequalification.questionnaires.new.breadcrumb.prequalification",
              undefined,
              "Prequalification",
            ),
            href: "/console/procurement/prequalification",
          },
          {
            label: t(
              "console.procurement.prequalification.questionnaires.new.breadcrumb.questionnaires",
              undefined,
              "Questionnaires",
            ),
            href: "/console/procurement/prequalification/questionnaires",
          },
          { label: t("console.procurement.prequalification.questionnaires.new.breadcrumb.new", undefined, "New") },
        ]}
        title={t("console.procurement.prequalification.questionnaires.new.title", undefined, "New Questionnaire")}
        subtitle={t(
          "console.procurement.prequalification.questionnaires.new.subtitle",
          undefined,
          "Define the questions vendors must answer.",
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createQuestionnaire}
          cancelHref="/console/procurement/prequalification/questionnaires"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.prequalification.questionnaires.new.field.code", undefined, "Code")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="code" required placeholder="GENERAL-2026" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.prequalification.questionnaires.new.field.name", undefined, "Name")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input
                name="name"
                required
                placeholder={t(
                  "console.procurement.prequalification.questionnaires.new.field.namePlaceholder",
                  undefined,
                  "General trades — annual prequal",
                )}
                className={INPUT}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.prequalification.questionnaires.new.field.description", undefined, "Description")}
            </span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
