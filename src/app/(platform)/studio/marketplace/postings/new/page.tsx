import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createPostingAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.postings.new.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.postings.new.title", undefined, "New Posting")}
        subtitle={t("console.marketplace.postings.new.subtitle", undefined, "Drafts are private until you publish.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPostingAction}
          cancelHref="/studio/marketplace/postings"
          submitLabel={t("console.marketplace.postings.new.submitLabel", undefined, "Save Draft")}
        >
          <Input
            label={t("console.marketplace.postings.new.fields.title", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.postings.new.fields.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={6} maxLength={8000} className="ps-input mt-1.5 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.postings.new.fields.postingType", undefined, "Posting Type")}
              </label>
              <select name="posting_type" className="ps-input mt-1.5 w-full" defaultValue="single">
                <option value="single">
                  {t("console.marketplace.postings.new.postingType.single", undefined, "Single")}
                </option>
                <option value="tour">
                  {t("console.marketplace.postings.new.postingType.tour", undefined, "Tour Leg")}
                </option>
                <option value="recurring">
                  {t("console.marketplace.postings.new.postingType.recurring", undefined, "Recurring")}
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.postings.new.fields.employment", undefined, "Employment")}
              </label>
              <select name="employment_type" className="ps-input mt-1.5 w-full" defaultValue="1099">
                <option value="1099">
                  {t("console.marketplace.postings.new.employment.contractor1099", undefined, "1099 Contractor")}
                </option>
                <option value="w2">
                  {t("console.marketplace.postings.new.employment.w2Crew", undefined, "W-2 Crew")}
                </option>
                <option value="contract">
                  {t("console.marketplace.postings.new.employment.contract", undefined, "Contract")}
                </option>
                <option value="volunteer">
                  {t("console.marketplace.postings.new.employment.volunteer", undefined, "Volunteer")}
                </option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.postings.new.fields.city", undefined, "City")}
              name="city"
              maxLength={80}
            />
            <Input
              label={t("console.marketplace.postings.new.fields.region", undefined, "Region/State")}
              name="region"
              maxLength={80}
            />
            <Input
              label={t("console.marketplace.postings.new.fields.country", undefined, "Country")}
              name="country"
              maxLength={80}
              placeholder="US"
            />
          </div>
          <Input
            label={t("console.marketplace.postings.new.fields.roles", undefined, "Roles — Comma-separated")}
            name="role_taxonomy"
            placeholder={t(
              "console.marketplace.postings.new.placeholders.roles",
              undefined,
              "A1, A2, Lighting Designer, Rigger",
            )}
          />
          <Input
            label={t("console.marketplace.postings.new.fields.certsRequired", undefined, "Certifications Required")}
            name="certs_required"
            placeholder={t(
              "console.marketplace.postings.new.placeholders.certsRequired",
              undefined,
              "ETCP Rigging, OSHA-30",
            )}
          />
          <Input
            label={t("console.marketplace.postings.new.fields.unionsRequired", undefined, "Unions Required")}
            name="union_required"
            placeholder={t(
              "console.marketplace.postings.new.placeholders.unionsRequired",
              undefined,
              "IATSE Local 1, IATSE Local 80",
            )}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.postings.new.fields.dayRateMin", undefined, "Day Rate Min")}
              name="day_rate_min"
              placeholder="450"
            />
            <Input
              label={t("console.marketplace.postings.new.fields.dayRateMax", undefined, "Day Rate Max")}
              name="day_rate_max"
              placeholder="900"
            />
            <Input
              label={t("console.marketplace.postings.new.fields.currency", undefined, "Currency")}
              name="currency"
              maxLength={3}
              defaultValue="USD"
            />
          </div>
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.marketplace.postings.new.provided.legend", undefined, "Provided")}
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="travel_paid" />{" "}
              {t("console.marketplace.postings.new.provided.travelPaid", undefined, "Travel paid")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lodging_provided" />{" "}
              {t("console.marketplace.postings.new.provided.lodgingProvided", undefined, "Lodging provided")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="vetted_only" />{" "}
              {t(
                "console.marketplace.postings.new.provided.vettedOnly",
                undefined,
                "Vetted-only — Verified-creds Candidates",
              )}
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
