import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createThreat } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.threats.new.eyebrow", undefined, "Safety")}
        title={t("console.safety.threats.new.title", undefined, "New Threat")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createThreat}
          cancelHref="/studio/safety/threats"
          submitLabel={t("console.safety.threats.new.submit", undefined, "Add Threat")}
        >
          <Input
            label={t("console.safety.threats.new.fields.code", undefined, "Code")}
            name="code"
            maxLength={40}
            placeholder={t("console.safety.threats.new.placeholders.code", undefined, "THR-001")}
            required
          />
          <Input
            label={t("console.safety.threats.new.fields.title", undefined, "Title")}
            name="title"
            maxLength={200}
            placeholder={t("console.safety.threats.new.placeholders.title", undefined, "Short headline")}
            required
          />
          <div>
            <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.threats.new.fields.description", undefined, "Description")}
            </label>
            <textarea id="description"
              name="description"
              rows={4}
              maxLength={5000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.safety.threats.new.placeholders.description",
                undefined,
                "Free-form context. Distribution scoped by classification.",
              )}
            />
          </div>
          <div>
            <label htmlFor="severity" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.threats.new.fields.severity", undefined, "Severity")}
            </label>
            <select id="severity" name="severity" defaultValue="medium" className="ps-input mt-1.5 w-full" required>
              <option value="low">{t("console.safety.threats.new.severity.low", undefined, "Low")}</option>
              <option value="medium">{t("console.safety.threats.new.severity.medium", undefined, "Medium")}</option>
              <option value="high">{t("console.safety.threats.new.severity.high", undefined, "High")}</option>
              <option value="critical">
                {t("console.safety.threats.new.severity.critical", undefined, "Critical")}
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="likelihood" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.threats.new.fields.likelihood", undefined, "Likelihood")}
            </label>
            <select id="likelihood" name="likelihood" defaultValue="possible" className="ps-input mt-1.5 w-full" required>
              <option value="rare">{t("console.safety.threats.new.likelihood.rare", undefined, "Rare")}</option>
              <option value="unlikely">
                {t("console.safety.threats.new.likelihood.unlikely", undefined, "Unlikely")}
              </option>
              <option value="possible">
                {t("console.safety.threats.new.likelihood.possible", undefined, "Possible")}
              </option>
              <option value="likely">{t("console.safety.threats.new.likelihood.likely", undefined, "Likely")}</option>
              <option value="almost_certain">
                {t("console.safety.threats.new.likelihood.almostCertain", undefined, "Almost certain")}
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="treatment" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.threats.new.fields.treatment", undefined, "Treatment")}
            </label>
            <select id="treatment" name="treatment" defaultValue="mitigate" className="ps-input mt-1.5 w-full">
              <option value="mitigate">
                {t("console.safety.threats.new.treatment.mitigate", undefined, "Mitigate")}
              </option>
              <option value="accept">{t("console.safety.threats.new.treatment.accept", undefined, "Accept")}</option>
              <option value="transfer">
                {t("console.safety.threats.new.treatment.transfer", undefined, "Transfer")}
              </option>
              <option value="avoid">{t("console.safety.threats.new.treatment.avoid", undefined, "Avoid")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="classification" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.threats.new.fields.classification", undefined, "Classification")}
            </label>
            <select id="classification" name="classification" defaultValue="internal" className="ps-input mt-1.5 w-full">
              <option value="public">
                {t("console.safety.threats.new.classification.public", undefined, "Public")}
              </option>
              <option value="internal">
                {t("console.safety.threats.new.classification.internal", undefined, "Internal")}
              </option>
              <option value="confidential">
                {t("console.safety.threats.new.classification.confidential", undefined, "Confidential")}
              </option>
              <option value="restricted">
                {t("console.safety.threats.new.classification.restricted", undefined, "Restricted")}
              </option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
