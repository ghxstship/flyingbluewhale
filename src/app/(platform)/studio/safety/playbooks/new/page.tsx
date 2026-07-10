import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createPlaybook } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.playbooks.new.eyebrow", undefined, "Safety")}
        title={t("console.safety.playbooks.new.title", undefined, "New Playbook")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createPlaybook}
          cancelHref="/studio/safety/playbooks"
          submitLabel={t("console.safety.playbooks.new.submitLabel", undefined, "Create Playbook")}
        >
          <div>
            <Input
              label={t("console.safety.playbooks.new.slugLabel", undefined, "Slug")}
              name="slug"
              maxLength={80}
              placeholder="evacuation-stadium-a"
              required
            />
            <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {t(
                "console.safety.playbooks.new.slugHint",
                undefined,
                "Lowercase letters, digits, dashes. Used in the URL.",
              )}
            </p>
          </div>
          <Input
            label={t("console.safety.playbooks.new.titleLabel", undefined, "Title")}
            name="title"
            maxLength={200}
            placeholder={t("console.safety.playbooks.new.titlePlaceholder", undefined, "Stadium A evacuation")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.playbooks.new.summaryLabel", undefined, "Summary")}
            </label>
            <textarea
              name="summary"
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.safety.playbooks.new.summaryPlaceholder",
                undefined,
                "One paragraph: when to invoke, who's accountable, what triggers it.",
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.playbooks.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="general" className="ps-input mt-1.5 w-full">
              <option value="crisis">{t("console.safety.playbooks.new.kind.crisis", undefined, "Crisis")}</option>
              <option value="safety">{t("console.safety.playbooks.new.kind.safety", undefined, "Safety")}</option>
              <option value="onboarding">
                {t("console.safety.playbooks.new.kind.onboarding", undefined, "Onboarding")}
              </option>
              <option value="conops">{t("console.safety.playbooks.new.kind.conops", undefined, "ConOps")}</option>
              <option value="general">{t("console.safety.playbooks.new.kind.general", undefined, "General")}</option>
            </select>
          </div>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.safety.playbooks.new.footnote",
              undefined,
              "Body content (sections, steps, attachments) is authored on the playbook detail page after creation.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
