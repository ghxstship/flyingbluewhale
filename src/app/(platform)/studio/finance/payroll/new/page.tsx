import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createPayrollRun } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.payroll.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.payroll.new.title", undefined, "New Payroll Run")}
        subtitle={t(
          "console.finance.payroll.new.subtitle",
          undefined,
          "A weekly payroll run per project. Worker lines + WH-347 PDF generation follow on the detail page.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPayrollRun}
          cancelHref="/studio/finance/payroll"
          submitLabel={t("console.finance.payroll.new.submit", undefined, "Create Run")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.finance.payroll.new.project", undefined, "Project")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <select name="project_id" required className={INPUT}>
              <option value="">{t("console.finance.payroll.new.selectPlaceholder", undefined, "Select…")}</option>
              {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.payroll.new.weekEnding", undefined, "Week ending")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input type="date" name="week_ending" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.payroll.new.periodStart", undefined, "Period start")}</span>
              <input type="date" name="pay_period_start" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.payroll.new.periodEnd", undefined, "Period end")}</span>
              <input type="date" name="pay_period_end" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.payroll.new.stateCode", undefined, "State code")}</span>
              <input
                name="state_code"
                maxLength={4}
                placeholder={t("console.finance.payroll.new.stateCodePlaceholder", undefined, "CA, NV, TX…")}
                className={`${INPUT} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.payroll.new.agencyReport", undefined, "Agency report")}</span>
              <select name="agency_report_type" className={INPUT} defaultValue="none">
                <option value="none">{t("console.finance.payroll.new.agency.none", undefined, "None")}</option>
                <option value="wh_347">
                  {t("console.finance.payroll.new.agency.wh347", undefined, "WH-347 (Federal Davis-Bacon)")}
                </option>
                <option value="ca_dir">{t("console.finance.payroll.new.agency.caDir", undefined, "CA DIR")}</option>
                <option value="ny_pwa">{t("console.finance.payroll.new.agency.nyPwa", undefined, "NY PWA")}</option>
                <option value="wa_lni">{t("console.finance.payroll.new.agency.waLni", undefined, "WA L&I")}</option>
                <option value="state_other">
                  {t("console.finance.payroll.new.agency.stateOther", undefined, "Other state")}
                </option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.payroll.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
