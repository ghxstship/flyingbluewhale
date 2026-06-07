import Link from "next/link";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createServiceRequest } from "@/app/(platform)/console/services/requests/actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function MobileNewRequest() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/requests" className="text-xs text-[var(--p-text-2)]">
        {t("m.requests.new.backLink", undefined, "← Requests")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{t("m.requests.new.title", undefined, "Open Request")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.requests.new.subtitle",
          undefined,
          "Log it from the field. Pick the right severity — P1 wakes the on-call, P3 hits ops in the hour.",
        )}
      </p>
      <div className="mt-5">
        <FormShell
          action={createServiceRequest}
          cancelHref="/m/requests"
          submitLabel={t("m.requests.new.submit", undefined, "Open")}
        >
          <input type="hidden" name="shell" value="mobile" />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("m.requests.new.severity.label", undefined, "Severity")}
            </label>
            <select name="severity" defaultValue="P3" className="ps-input mt-1.5 w-full" required>
              <option value="P1">{t("m.requests.new.severity.p1", undefined, "P1 — live-event blocker")}</option>
              <option value="P2">{t("m.requests.new.severity.p2", undefined, "P2 — urgent")}</option>
              <option value="P3">{t("m.requests.new.severity.p3", undefined, "P3 — standard")}</option>
              <option value="P4">{t("m.requests.new.severity.p4", undefined, "P4 — low")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("m.requests.new.category.label", undefined, "Category")}
            </label>
            <select name="category" defaultValue="repair" className="ps-input mt-1.5 w-full" required>
              <option value="AV">{t("m.requests.new.category.av", undefined, "AV")}</option>
              <option value="cleaning">{t("m.requests.new.category.cleaning", undefined, "Cleaning")}</option>
              <option value="repair">{t("m.requests.new.category.repair", undefined, "Repair")}</option>
              <option value="IT">{t("m.requests.new.category.it", undefined, "IT")}</option>
              <option value="hospitality">{t("m.requests.new.category.hospitality", undefined, "Hospitality")}</option>
              <option value="security">{t("m.requests.new.category.security", undefined, "Security")}</option>
              <option value="other">{t("m.requests.new.category.other", undefined, "Other")}</option>
            </select>
          </div>
          <Input
            label={t("m.requests.new.summary.label", undefined, "Summary")}
            name="summary"
            maxLength={200}
            placeholder={t("m.requests.new.summary.placeholder", undefined, "One line — what's wrong?")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("m.requests.new.detail.label", undefined, "Detail")}
            </label>
            <textarea
              name="description"
              rows={4}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
              placeholder={t("m.requests.new.detail.placeholder", undefined, "Where, what, who's affected")}
            />
          </div>
        </FormShell>
      </div>
    </div>
  );
}
