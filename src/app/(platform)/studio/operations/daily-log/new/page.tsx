import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createDailyLog } from "./actions";

export const dynamic = "force-dynamic";

const INPUT_CLS = "ps-input w-full";
const LABEL_CLS = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  // NOTE: `projects` has no `status` column (LDP canon uses `project_state` /
  // `xpms_phase`); the old `.in("status", …)` filter referenced a non-existent
  // column, which errored the query and left the project picker empty — so no
  // daily log could ever be created. Select org projects like the other
  // project-pickers (e.g. inspections/new) do.
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.dailyLog.new.eyebrow", undefined, "Operations")}
        title={t("console.operations.dailyLog.new.title", undefined, "New Daily Log")}
        subtitle={t("console.operations.dailyLog.new.subtitle", undefined, "One entry per project per day.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createDailyLog}
          cancelHref="/studio/operations/daily-log"
          submitLabel={t("console.operations.dailyLog.new.submit", undefined, "Create Log")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>
              {t("console.operations.dailyLog.new.projectLabel", undefined, "Project")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <select name="project_id" required className={INPUT_CLS}>
              <option value="">
                {t("console.operations.dailyLog.new.projectPlaceholder", undefined, "Select a project…")}
              </option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>
              {t("console.operations.dailyLog.new.dateLabel", undefined, "Date")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input type="date" name="log_date" defaultValue={today} required className={INPUT_CLS} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>
              {t("console.operations.dailyLog.new.weatherSummaryLabel", undefined, "Weather summary")}
            </span>
            <input
              name="weather_summary"
              placeholder={t(
                "console.operations.dailyLog.new.weatherSummaryPlaceholder",
                undefined,
                "e.g. Sunny, 78°F, light breeze",
              )}
              className={INPUT_CLS}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>
                {t("console.operations.dailyLog.new.tempHighLabel", undefined, "Temp high (°F)")}
              </span>
              <input type="number" step="any" name="weather_temp_high_f" className={INPUT_CLS} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>
                {t("console.operations.dailyLog.new.tempLowLabel", undefined, "Temp low (°F)")}
              </span>
              <input type="number" step="any" name="weather_temp_low_f" className={INPUT_CLS} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>{t("console.operations.dailyLog.new.notesLabel", undefined, "Notes")}</span>
            <textarea
              name="notes"
              rows={4}
              placeholder={t(
                "console.operations.dailyLog.new.notesPlaceholder",
                undefined,
                "Site narrative, deliveries, visitors, milestones reached, blockers…",
              )}
              className={INPUT_CLS}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
