import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createPayrollRun } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
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
        eyebrow="Finance"
        title="New Payroll Run"
        subtitle="A weekly payroll run per project. Worker lines + WH-347 PDF generation follow on the detail page."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createPayrollRun} cancelHref="/console/finance/payroll" submitLabel="Create Run">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="project_id" required className={INPUT}>
              <option value="">Select…</option>
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
                Week ending<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="date" name="week_ending" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Period start</span>
              <input type="date" name="pay_period_start" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Period end</span>
              <input type="date" name="pay_period_end" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>State code</span>
              <input name="state_code" maxLength={4} placeholder="CA, NV, TX…" className={`${INPUT} font-mono`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Agency report</span>
              <select name="agency_report_type" className={INPUT} defaultValue="none">
                <option value="none">None</option>
                <option value="wh_347">WH-347 (Federal Davis-Bacon)</option>
                <option value="ca_dir">CA DIR</option>
                <option value="ny_pwa">NY PWA</option>
                <option value="wa_lni">WA L&amp;I</option>
                <option value="state_other">Other state</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
