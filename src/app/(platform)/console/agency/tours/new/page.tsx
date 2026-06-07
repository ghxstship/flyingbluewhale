import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTourAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.eyebrow", undefined, "Agency")}
          title={t("console.agency.tours.new.title", undefined, "New Tour")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.common.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [talentResp, agencyResp] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("id, act_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("act_name"),
    supabase
      .from("agencies")
      .select("id, display_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("display_name"),
  ]);
  const talents = (talentResp.data ?? []) as Array<{ id: string; act_name: string }>;
  const agencies = (agencyResp.data ?? []) as Array<{ id: string; display_name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.eyebrow", undefined, "Agency")}
        title={t("console.agency.tours.new.title", undefined, "New Tour")}
        subtitle={t("console.agency.tours.new.subtitle", undefined, "Multi-date routing container.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTourAction}
          cancelHref="/console/agency/tours"
          submitLabel={t("console.agency.tours.new.submit", undefined, "Create Tour")}
        >
          <Input
            label={t("console.agency.tours.new.fields.name", undefined, "Tour Name")}
            name="name"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.agency.tours.new.fields.talent", undefined, "Talent")}
            </label>
            <select name="talent_profile_id" required className="ps-input mt-1.5 w-full">
              <option value="">
                {t("console.agency.tours.new.fields.talentPlaceholder", undefined, "Select an act…")}
              </option>
              {talents.map((talent) => (
                <option key={talent.id} value={talent.id}>
                  {talent.act_name}
                </option>
              ))}
            </select>
          </div>
          {agencies.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.agency.tours.new.fields.agencyOptional", undefined, "Agency · Optional")}
              </label>
              <select name="agency_id" className="ps-input mt-1.5 w-full">
                <option value="">—</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.agency.tours.new.fields.starts", undefined, "Starts")}
              name="starts_on"
              type="date"
            />
            <Input label={t("console.agency.tours.new.fields.ends", undefined, "Ends")} name="ends_on" type="date" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.agency.tours.new.fields.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={4} maxLength={4000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
