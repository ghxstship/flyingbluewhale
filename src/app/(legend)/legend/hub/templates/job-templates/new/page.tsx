import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { getRequestT } from "@/lib/i18n/request";
import { createJobTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewJobTemplatePage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={t("console.settings.jobTemplates.new.title", undefined, "New Job Template")}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Templates", href: "/legend/hub/templates" },
          { label: "Job Templates", href: "/legend/hub/templates/job-templates" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-xl">
        <FormShell action={createJobTemplateAction} submitLabel={t("console.settings.jobTemplates.new.submit", undefined, "Create template")}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.settings.jobTemplates.field.name", undefined, "Name")}</span>
            <input name="name" required maxLength={120} className="ps-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.settings.jobTemplates.field.trade", undefined, "Trade (optional)")}</span>
            <input name="trade" maxLength={80} className="ps-input" placeholder="electrical, rigging…" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("console.settings.jobTemplates.field.steps", undefined, "Steps")}</span>
            <textarea
              name="steps"
              rows={6}
              className="ps-input"
              placeholder={t(
                "console.settings.jobTemplates.field.stepsHint",
                undefined,
                "One step per line. Prefix a line with '* ' to require a photo.",
              )}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
