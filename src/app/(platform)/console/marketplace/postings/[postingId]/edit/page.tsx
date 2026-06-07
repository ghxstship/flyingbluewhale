import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { updatePostingAction } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

type Posting = {
  id: string;
  title: string;
  description: string | null;
  posting_type: string;
  employment_type: string;
  region: string | null;
  city: string | null;
  country: string | null;
  role_taxonomy: string[];
  certs_required: string[];
  union_required: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  vetted_only: boolean;
  travel_paid: boolean;
  lodging_provided: boolean;
};

const dollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(0));

export default async function Page({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", postingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const p = data as Posting;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.postings.edit.eyebrow", undefined, "Marketplace · Posting")}
        title={t("console.marketplace.postings.edit.title", { title: p.title }, `Edit · ${p.title}`)}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updatePostingAction}
          cancelHref={`/console/marketplace/postings/${p.id}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          <input type="hidden" name="posting_id" value={p.id} />
          <Input
            label={t("console.marketplace.postings.edit.fields.title", undefined, "Title")}
            name="title"
            required
            maxLength={200}
            defaultValue={p.title}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.postings.edit.fields.description", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={6}
              maxLength={8000}
              className="ps-input mt-1.5 w-full"
              defaultValue={p.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.postings.edit.fields.postingType", undefined, "Posting Type")}
              </label>
              <select name="posting_type" className="ps-input mt-1.5 w-full" defaultValue={p.posting_type}>
                <option value="single">
                  {t("console.marketplace.postings.edit.postingType.single", undefined, "Single")}
                </option>
                <option value="tour">
                  {t("console.marketplace.postings.edit.postingType.tour", undefined, "Tour Leg")}
                </option>
                <option value="recurring">
                  {t("console.marketplace.postings.edit.postingType.recurring", undefined, "Recurring")}
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.marketplace.postings.edit.fields.employment", undefined, "Employment")}
              </label>
              <select name="employment_type" className="ps-input mt-1.5 w-full" defaultValue={p.employment_type}>
                <option value="1099">
                  {t("console.marketplace.postings.edit.employment.1099", undefined, "1099 Contractor")}
                </option>
                <option value="w2">
                  {t("console.marketplace.postings.edit.employment.w2", undefined, "W-2 Crew")}
                </option>
                <option value="contract">
                  {t("console.marketplace.postings.edit.employment.contract", undefined, "Contract")}
                </option>
                <option value="volunteer">
                  {t("console.marketplace.postings.edit.employment.volunteer", undefined, "Volunteer")}
                </option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.postings.edit.fields.city", undefined, "City")}
              name="city"
              maxLength={80}
              defaultValue={p.city ?? ""}
            />
            <Input
              label={t("console.marketplace.postings.edit.fields.region", undefined, "Region/State")}
              name="region"
              maxLength={80}
              defaultValue={p.region ?? ""}
            />
            <Input
              label={t("console.marketplace.postings.edit.fields.country", undefined, "Country")}
              name="country"
              maxLength={80}
              defaultValue={p.country ?? ""}
            />
          </div>
          <Input
            label={t("console.marketplace.postings.edit.fields.roles", undefined, "Roles")}
            name="role_taxonomy"
            defaultValue={p.role_taxonomy.join(", ")}
          />
          <Input
            label={t("console.marketplace.postings.edit.fields.certifications", undefined, "Certifications")}
            name="certs_required"
            defaultValue={p.certs_required.join(", ")}
          />
          <Input
            label={t("console.marketplace.postings.edit.fields.unions", undefined, "Unions")}
            name="union_required"
            defaultValue={p.union_required.join(", ")}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.postings.edit.fields.dayRateMin", undefined, "Day Rate Min")}
              name="day_rate_min"
              defaultValue={dollars(p.day_rate_min_cents)}
            />
            <Input
              label={t("console.marketplace.postings.edit.fields.dayRateMax", undefined, "Day Rate Max")}
              name="day_rate_max"
              defaultValue={dollars(p.day_rate_max_cents)}
            />
            <Input
              label={t("console.marketplace.postings.edit.fields.currency", undefined, "Currency")}
              name="currency"
              maxLength={3}
              defaultValue={p.currency}
            />
          </div>
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.marketplace.postings.edit.provided.legend", undefined, "Provided")}
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="travel_paid" defaultChecked={p.travel_paid} />{" "}
              {t("console.marketplace.postings.edit.provided.travelPaid", undefined, "Travel paid")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lodging_provided" defaultChecked={p.lodging_provided} />{" "}
              {t("console.marketplace.postings.edit.provided.lodgingProvided", undefined, "Lodging provided")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="vetted_only" defaultChecked={p.vetted_only} />{" "}
              {t("console.marketplace.postings.edit.provided.vettedOnly", undefined, "Vetted-only")}
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
