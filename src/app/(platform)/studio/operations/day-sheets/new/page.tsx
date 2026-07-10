import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createDaySheetAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.daySheets.eyebrow", undefined, "Operations")}
          title={t("console.daySheets.new.title", undefined, "New Day Sheet")}
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
  const [toursResp, projectsResp] = await Promise.all([
    supabase
      .from("tours")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("starts_on", { ascending: false, nullsFirst: false }),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
  ]);
  const tours = (toursResp.data ?? []) as Array<{ id: string; name: string }>;
  const projects = (projectsResp.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.daySheets.eyebrow", undefined, "Operations")}
        title={t("console.daySheets.new.title", undefined, "New Day Sheet")}
        subtitle={t("console.daySheets.new.subtitle", undefined, "One composed page for one tour date.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDaySheetAction}
          cancelHref="/studio/operations/day-sheets"
          submitLabel={t("console.daySheets.new.submit", undefined, "Create Day Sheet")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.daySheets.new.fields.tour", undefined, "Tour · Optional")}
            </label>
            <select name="tour_id" className="ps-input mt-1.5 w-full">
              <option value="">—</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.daySheets.new.fields.project", undefined, "Date · Project · Optional")}
            </label>
            <select name="project_id" className="ps-input mt-1.5 w-full">
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("console.daySheets.new.fields.city", undefined, "City")} name="city" maxLength={200} />
            <Input label={t("console.daySheets.new.fields.date", undefined, "Date")} name="sheet_date" type="date" />
          </div>
          <Input label={t("console.daySheets.new.fields.venue", undefined, "Venue")} name="venue" maxLength={200} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("console.daySheets.new.fields.crewCall", undefined, "Crew Call")} name="crew_call" type="time" />
            <Input label={t("console.daySheets.new.fields.doors", undefined, "Doors")} name="doors" type="time" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.daySheets.new.fields.set", undefined, "Headline Set")}
              name="headline_set"
              maxLength={120}
              placeholder="21:00-22:45"
            />
            <Input label={t("console.daySheets.new.fields.curfew", undefined, "Curfew")} name="curfew" type="time" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
