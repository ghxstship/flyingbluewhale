import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTieredHoldAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.holds.new.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.holds.new.title", undefined, "New Hold")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.holds.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: venues }, { data: talent }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name").limit(500),
    supabase.from("talent_profiles").select("id, act_name").eq("org_id", session.orgId).order("act_name").limit(500),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bookings.holds.new.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.holds.new.title", undefined, "New Hold")}
        subtitle={t("console.bookings.holds.new.subtitle", undefined, "Tier 1 = first refusal.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTieredHoldAction}
          cancelHref="/studio/bookings/holds"
          submitLabel={t("console.bookings.holds.new.submitLabel", undefined, "Place Hold")}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.bookings.holds.new.tierLabel", undefined, "Tier")}
              </label>
              <select name="tier" className="ps-input mt-1.5 w-full" defaultValue="1">
                <option value="1">{t("console.bookings.holds.new.tier1", undefined, "Tier 1 — First Refusal")}</option>
                <option value="2">{t("console.bookings.holds.new.tier2", undefined, "Tier 2")}</option>
                <option value="3">{t("console.bookings.holds.new.tier3", undefined, "Tier 3")}</option>
                <option value="4">{t("console.bookings.holds.new.tier4", undefined, "Tier 4")}</option>
                <option value="5">{t("console.bookings.holds.new.tier5", undefined, "Tier 5")}</option>
              </select>
            </div>
            <Input
              label={t("console.bookings.holds.new.labelLabel", undefined, "Label")}
              name="label"
              placeholder={t("console.bookings.holds.new.labelPlaceholder", undefined, "MMW26 mainstage")}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.bookings.holds.new.startsLabel", undefined, "Starts")}
              name="starts_at"
              type="datetime-local"
              required
            />
            <Input
              label={t("console.bookings.holds.new.endsLabel", undefined, "Ends")}
              name="ends_at"
              type="datetime-local"
              required
            />
          </div>
          <Input
            label={t("console.bookings.holds.new.autoReleaseLabel", undefined, "Auto-release on")}
            name="auto_release_on"
            type="datetime-local"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.bookings.holds.new.venueLabel", undefined, "Venue · Optional")}
              </label>
              <select name="venue_id" className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="">—</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.bookings.holds.new.talentLabel", undefined, "Talent · Optional")}
              </label>
              <select name="talent_profile_id" className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="">—</option>
                {(talent ?? []).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.act_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
