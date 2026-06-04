import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createVisaCase } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.visa.new.eyebrow", undefined, "Participants · Visa")}
        title={t("console.participants.visa.new.title", undefined, "New Visa Case")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createVisaCase}
          cancelHref="/console/participants/visa"
          submitLabel={t("console.participants.visa.new.submit", undefined, "Open Case")}
        >
          <Input
            label={t("console.participants.visa.new.personName", undefined, "Person Name")}
            name="person_name"
            maxLength={160}
            placeholder={t("console.participants.visa.new.personNamePlaceholder", undefined, "As on passport")}
            required
          />
          <Input
            label={t("console.participants.visa.new.nationality", undefined, "Nationality")}
            name="nationality"
            maxLength={80}
            placeholder={t("console.participants.visa.new.nationalityPlaceholder", undefined, "ISO-3166 name")}
          />
          <Input
            label={t("console.participants.visa.new.passportNumber", undefined, "Passport Number")}
            name="passport_no"
            maxLength={60}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.participants.visa.new.statusLabel", undefined, "Status")}
            </label>
            <select name="status" defaultValue="open" className="input-base mt-1.5 w-full">
              <option value="open">{t("console.participants.visa.new.status.open", undefined, "Open")}</option>
              <option value="invitation_letter">
                {t("console.participants.visa.new.status.invitationLetter", undefined, "Invitation letter sent")}
              </option>
              <option value="application_filed">
                {t("console.participants.visa.new.status.applicationFiled", undefined, "Application filed")}
              </option>
              <option value="approved">
                {t("console.participants.visa.new.status.approved", undefined, "Approved")}
              </option>
              <option value="denied">{t("console.participants.visa.new.status.denied", undefined, "Denied")}</option>
              <option value="closed">{t("console.participants.visa.new.status.closed", undefined, "Closed")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
