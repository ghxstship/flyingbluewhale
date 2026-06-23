import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createPolicy } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.insurance.new.eyebrow", undefined, "Legal · Insurance")}
        title={t("console.legal.insurance.new.title", undefined, "New Policy")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createPolicy}
          cancelHref="/studio/legal/insurance"
          submitLabel={t("console.legal.insurance.new.submit", undefined, "Add Policy")}
        >
          <Input
            label={t("console.legal.insurance.new.carrierLabel", undefined, "Carrier")}
            name="carrier"
            maxLength={160}
            placeholder={t("console.legal.insurance.new.carrierPlaceholder", undefined, "e.g. Lloyd's of London")}
            required
          />
          <Input
            label={t("console.legal.insurance.new.policyNumberLabel", undefined, "Policy Number")}
            name="policy_no"
            maxLength={120}
            placeholder={t("console.legal.insurance.new.policyNumberPlaceholder", undefined, "e.g. LL-2025-00482")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.insurance.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="general_liability" className="ps-input mt-1.5 w-full" required>
              <option value="general_liability">
                {t("console.legal.insurance.new.kind.generalLiability", undefined, "General Liability")}
              </option>
              <option value="motor">{t("console.legal.insurance.new.kind.motor", undefined, "Motor")}</option>
              <option value="professional_indemnity">
                {t("console.legal.insurance.new.kind.professionalIndemnity", undefined, "Professional Indemnity")}
              </option>
              <option value="event_cancellation">
                {t("console.legal.insurance.new.kind.eventCancellation", undefined, "Event Cancellation")}
              </option>
              <option value="workers_compensation">
                {t("console.legal.insurance.new.kind.workersCompensation", undefined, "Workers Compensation")}
              </option>
              <option value="property">{t("console.legal.insurance.new.kind.property", undefined, "Property")}</option>
              <option value="other">{t("console.legal.insurance.new.kind.other", undefined, "Other")}</option>
            </select>
          </div>
          <Input
            label={t("console.legal.insurance.new.effectiveOnLabel", undefined, "Effective On")}
            name="effective_on"
            type="date"
          />
          <Input
            label={t("console.legal.insurance.new.expiresOnLabel", undefined, "Expires On")}
            name="expires_on"
            type="date"
          />
        </FormShell>
      </div>
    </>
  );
}
