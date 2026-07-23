import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createDsar } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.dsar.new.eyebrow", undefined, "Legal · Privacy")}
        title={t("console.legal.privacy.dsar.new.title", undefined, "New DSAR Request")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDsar}
          cancelHref="/studio/legal/privacy/dsar"
          submitLabel={t("console.legal.privacy.dsar.new.submit", undefined, "Log Request")}
        >
          <Input
            label={t("console.legal.privacy.dsar.new.requesterEmail", undefined, "Requester Email")}
            name="requester_email"
            type="email"
            required
          />
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.privacy.dsar.new.kind", undefined, "Kind")}
            </label>
            <select id="kind" name="kind" defaultValue="access" className="ps-input mt-1.5 w-full" required>
              <option value="access">{t("console.legal.privacy.dsar.new.kindAccess", undefined, "Access")}</option>
              <option value="deletion">
                {t("console.legal.privacy.dsar.new.kindDeletion", undefined, "Deletion")}
              </option>
              <option value="correction">
                {t("console.legal.privacy.dsar.new.kindCorrection", undefined, "Correction")}
              </option>
              <option value="portability">
                {t("console.legal.privacy.dsar.new.kindPortability", undefined, "Portability")}
              </option>
              <option value="objection">
                {t("console.legal.privacy.dsar.new.kindObjection", undefined, "Objection")}
              </option>
            </select>
          </div>
          <Input label={t("console.legal.privacy.dsar.new.dueBy", undefined, "Due By")} name="due_by" type="date" />
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.privacy.dsar.new.notes", undefined, "Notes")}
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
