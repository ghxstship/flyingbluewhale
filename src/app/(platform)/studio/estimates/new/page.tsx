import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createEstimate } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const [{ data: projects }, { data: dbs }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
    supabase
      .from("cost_databases")
      .select("id, name, source")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.estimates.new.eyebrow", undefined, "Creative")}
        title={t("console.estimates.new.title", undefined, "New Estimate")}
        subtitle={t(
          "console.estimates.new.subtitle",
          undefined,
          "Joins takeoff quantities to cost-database unit costs with markup. Exports to budgets + proposal SOV.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createEstimate}
          cancelHref="/studio/estimates"
          submitLabel={t("console.estimates.new.submit", undefined, "Create Estimate")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.estimates.new.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.estimates.new.namePlaceholder", undefined, "Schematic Design Estimate")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.estimates.new.project", undefined, "Project")}
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
              <span className={LBL}>{t("console.estimates.new.costDatabase", undefined, "Cost database")}</span>
              <select name="cost_database_id" className={INPUT}>
                <option value="">—</option>
                {((dbs ?? []) as Array<{ id: string; name: string; source: string }>).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.source})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.estimates.new.defaultMarkupPct", undefined, "Default markup %")}</span>
              <input
                type="number"
                step="0.0001"
                name="default_markup_pct"
                placeholder={t("console.estimates.new.defaultMarkupPctPlaceholder", undefined, "0.0700 for 7%")}
                className={INPUT}
              />
              <span className="text-[11px] text-[var(--p-text-2)]">
                {t("console.estimates.new.defaultMarkupHint", undefined, "Stored as a fraction (0.07 = 7%).")}
              </span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.estimates.new.defaultWasteFactor", undefined, "Default waste factor")}
              </span>
              <input
                type="number"
                step="0.0001"
                name="default_waste_factor"
                placeholder={t("console.estimates.new.defaultWasteFactorPlaceholder", undefined, "0.05 for 5% waste")}
                className={INPUT}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.estimates.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
