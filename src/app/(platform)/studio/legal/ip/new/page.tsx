import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createTrademark } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.ip.new.eyebrow", undefined, "Legal · IP")}
        title={t("console.legal.ip.new.title", undefined, "New Trademark")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTrademark}
          cancelHref="/studio/legal/ip"
          submitLabel={t("console.legal.ip.new.submit", undefined, "Register Mark")}
        >
          <Input
            label={t("console.legal.ip.new.fields.mark", undefined, "Mark")}
            name="mark"
            maxLength={160}
            placeholder={t("console.legal.ip.new.placeholders.mark", undefined, "e.g. EVENTLY")}
            required
          />
          <Input
            label={t("console.legal.ip.new.fields.jurisdiction", undefined, "Jurisdiction")}
            name="jurisdiction"
            maxLength={80}
            placeholder={t("console.legal.ip.new.placeholders.jurisdiction", undefined, "e.g. US, EU, UK")}
          />
          <Input
            label={t("console.legal.ip.new.fields.registrationNumber", undefined, "Registration Number")}
            name="registration_no"
            maxLength={120}
            placeholder={t("console.legal.ip.new.placeholders.registrationNumber", undefined, "e.g. 6,123,456")}
          />
          <Input
            label={t("console.legal.ip.new.fields.registeredOn", undefined, "Registered On")}
            name="registered_on"
            type="date"
          />
          <Input
            label={t("console.legal.ip.new.fields.expiresOn", undefined, "Expires On")}
            name="expires_on"
            type="date"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.ip.new.fields.status", undefined, "Status")}
            </label>
            <select name="status" defaultValue="active" className="ps-input mt-1.5 w-full">
              <option value="pending">{t("console.legal.ip.new.status.pending", undefined, "Pending")}</option>
              <option value="active">{t("console.legal.ip.new.status.active", undefined, "Active")}</option>
              <option value="opposed">{t("console.legal.ip.new.status.opposed", undefined, "Opposed")}</option>
              <option value="abandoned">{t("console.legal.ip.new.status.abandoned", undefined, "Abandoned")}</option>
              <option value="expired">{t("console.legal.ip.new.status.expired", undefined, "Expired")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
