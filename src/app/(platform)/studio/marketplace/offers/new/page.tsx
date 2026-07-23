import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { DEPOSIT_PCT_DEFAULT, DEPOSIT_PCT_MIN, DEPOSIT_PCT_MAX, BALANCE_TERMS_DEFAULT } from "@/lib/payment-terms";
import { createOfferAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.offers.new.title", undefined, "New Offer")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.offers.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [talentResp, projResp] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("id, act_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("act_name"),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
  ]);
  const talents = (talentResp.data ?? []) as Array<{ id: string; act_name: string }>;
  const projects = (projResp.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.offers.new.title", undefined, "New Offer")}
        subtitle={t("console.marketplace.offers.new.subtitle", undefined, "Default 60/40, balance on load-in.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createOfferAction}
          cancelHref="/studio/marketplace/offers"
          submitLabel={t("console.marketplace.offers.new.submit", undefined, "Save Draft")}
        >
          <div>
            <label htmlFor="talent_profile_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.offers.new.talentLabel", undefined, "Talent")}
            </label>
            <select id="talent_profile_id" name="talent_profile_id" required className="ps-input mt-1.5 w-full">
              <option value="">
                {t("console.marketplace.offers.new.talentPlaceholder", undefined, "Select a talent profile…")}
              </option>
              {talents.map((talent) => (
                <option key={talent.id} value={talent.id}>
                  {talent.act_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.offers.new.projectLabel", undefined, "Project · Optional")}
            </label>
            <select id="project_id" name="project_id" className="ps-input mt-1.5 w-full">
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.marketplace.offers.new.performanceDate", undefined, "Performance Date")}
            name="performance_date"
            type="date"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.marketplace.offers.new.slotStart", undefined, "Slot Start")}
              name="slot_start"
              type="datetime-local"
            />
            <Input
              label={t("console.marketplace.offers.new.slotEnd", undefined, "Slot End")}
              name="slot_end"
              type="datetime-local"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("console.marketplace.offers.new.fee", undefined, "Fee")}
              name="fee"
              required
              placeholder="5000"
            />
            <Input
              label={t("console.marketplace.offers.new.currency", undefined, "Currency")}
              name="currency"
              maxLength={3}
              defaultValue="USD"
            />
            <Input
              label={t("console.marketplace.offers.new.depositPct", undefined, "Deposit %")}
              name="deposit_pct"
              type="number"
              defaultValue={DEPOSIT_PCT_DEFAULT}
              min={DEPOSIT_PCT_MIN}
              max={DEPOSIT_PCT_MAX}
            />
          </div>
          <div>
            <label htmlFor="balance_terms" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.marketplace.offers.new.balanceTermsLabel", undefined, "Balance Terms")}
            </label>
            <select id="balance_terms" name="balance_terms" className="ps-input mt-1.5 w-full" defaultValue={BALANCE_TERMS_DEFAULT}>
              <option value="load_in">
                {t("console.marketplace.offers.new.balanceTerms.loadIn", undefined, "On Load-In")}
              </option>
              <option value="show_day">
                {t("console.marketplace.offers.new.balanceTerms.showDay", undefined, "On Show Day")}
              </option>
              <option value="net_30">
                {t("console.marketplace.offers.new.balanceTerms.net30", undefined, "Net 30 Post-Show")}
              </option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
