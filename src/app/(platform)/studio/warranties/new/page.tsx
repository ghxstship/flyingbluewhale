import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createWarranty } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: projects }, { data: vendors }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.warranties.new.eyebrow", undefined, "Closeout")}
        title={t("console.warranties.new.title", undefined, "New Warranty")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createWarranty}
          cancelHref="/studio/warranties"
          submitLabel={t("console.warranties.new.submit", undefined, "Create Warranty")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.warranties.new.fields.name", undefined, "Coverage name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.warranties.new.fields.namePlaceholder", undefined, "HVAC system · Trane RT-3")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.warranties.new.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
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
              <span className={LBL}>{t("console.warranties.new.fields.vendor", undefined, "Vendor / Warrantor")}</span>
              <select name="vendor_id" className={INPUT}>
                <option value="">—</option>
                {((vendors ?? []) as Array<{ id: string; name: string }>).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.warranties.new.fields.start", undefined, "Start")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input type="date" name="start_date" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.warranties.new.fields.end", undefined, "End")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input type="date" name="end_date" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.warranties.new.fields.duration", undefined, "Duration (Months)")}</span>
              <input type="number" min="1" name="duration_months" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.warranties.new.fields.warrantorEmail", undefined, "Warrantor email")}
              </span>
              <input type="email" name="warrantor_email" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.warranties.new.fields.warrantorPhone", undefined, "Warrantor phone")}
              </span>
              <input name="warrantor_phone" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.warranties.new.fields.coverageSummary", undefined, "Coverage Summary (Markdown)")}
            </span>
            <textarea name="coverage_summary_md" rows={4} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
