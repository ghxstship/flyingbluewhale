import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createSafeguardingReport } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.safeguarding.new.eyebrow", undefined, "Safety · Safeguarding")}
        title={t("console.safety.safeguarding.new.title", undefined, "File Report")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createSafeguardingReport}
          cancelHref="/studio/safety/safeguarding"
          submitLabel={t("console.safety.safeguarding.new.submitLabel", undefined, "File Report")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.safeguarding.new.narrativeLabel", undefined, "Narrative")}
            </label>
            <textarea name="narrative" rows={6} maxLength={5000} className="ps-input mt-1.5 w-full" required />
          </div>
          <Input
            label={t("console.safety.safeguarding.new.subjectRefLabel", undefined, "Subject Reference")}
            name="subject_ref"
            maxLength={120}
            placeholder={t("console.safety.safeguarding.new.subjectRefPlaceholder", undefined, "Pseudonymous ID")}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.safeguarding.new.statusLabel", undefined, "Status")}
            </label>
            <select name="status" defaultValue="received" className="ps-input mt-1.5 w-full">
              <option value="received">
                {t("console.safety.safeguarding.new.statusReceived", undefined, "Received")}
              </option>
              <option value="triage">{t("console.safety.safeguarding.new.statusTriage", undefined, "Triage")}</option>
              <option value="under_review">
                {t("console.safety.safeguarding.new.statusUnderReview", undefined, "Under review")}
              </option>
              <option value="referred">
                {t("console.safety.safeguarding.new.statusReferred", undefined, "Referred")}
              </option>
              <option value="closed">{t("console.safety.safeguarding.new.statusClosed", undefined, "Closed")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
