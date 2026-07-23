import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createWarranty } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");
  const projects = (projectRows ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.warranties.new.eyebrow", undefined, "Warranties")}
        title={t("console.assets.warranties.new.title", undefined, "New Warranty")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createWarranty}
          cancelHref="/studio/assets/warranties"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <div>
            <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.assets.warranties.new.projectLabel", undefined, "Project")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </label>
            <select id="project_id" name="project_id" required className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="" disabled>
                {t("common.selectEllipsis", undefined, "Select…")}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.assets.warranties.new.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder="Main array · 5-year manufacturer warranty"
          />
          <Input
            label={t("console.assets.warranties.new.warrantorNameLabel", undefined, "Warrantor name")}
            name="warrantor_name"
            maxLength={200}
          />
          <Input
            label={t("console.assets.warranties.new.warrantorEmailLabel", undefined, "Warrantor email")}
            name="warrantor_email"
            type="email"
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.assets.warranties.new.startDateLabel", undefined, "Start date")}
              name="start_date"
              type="date"
              required
            />
            <Input
              label={t("console.assets.warranties.new.endDateLabel", undefined, "End date")}
              name="end_date"
              type="date"
              required
            />
          </div>
          <Input
            label={t("console.assets.warranties.new.durationMonthsLabel", undefined, "Duration (months)")}
            name="duration_months"
            type="number"
            step="1"
            min="0"
          />
          <div>
            <label htmlFor="coverage_summary_md" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.assets.warranties.new.coverageLabel", undefined, "Coverage summary")}
            </label>
            <textarea id="coverage_summary_md" name="coverage_summary_md" rows={4} maxLength={5000} className="ps-input mt-1.5 w-full" />
          </div>
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.assets.warranties.new.notesLabel", undefined, "Notes")}
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
