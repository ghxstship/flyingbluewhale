import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createForecast } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.forecasts.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.forecasts.new.title", undefined, "New EAC Forecast")}
        subtitle={t(
          "console.finance.forecasts.new.subtitle",
          undefined,
          "A forecast snapshot — per-cost-code committed + incurred + forecast-to-complete rollup with variance.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createForecast}
          cancelHref="/console/finance/forecasts"
          submitLabel={t("console.finance.forecasts.new.submit", undefined, "Create Forecast")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.finance.forecasts.new.nameLabel", undefined, "Name")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.finance.forecasts.new.namePlaceholder", undefined, "March close 2026")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.forecasts.new.projectLabel", undefined, "Project")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.forecasts.new.methodologyLabel", undefined, "Methodology")}
              </span>
              <select name="methodology" className={INPUT} defaultValue="manual">
                <option value="manual">
                  {t("console.finance.forecasts.new.methodology.manual", undefined, "Manual")}
                </option>
                <option value="earned_value">
                  {t("console.finance.forecasts.new.methodology.earnedValue", undefined, "Earned Value")}
                </option>
                <option value="automatic">
                  {t("console.finance.forecasts.new.methodology.automatic", undefined, "Automatic")}
                </option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.forecasts.new.notesLabel", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
