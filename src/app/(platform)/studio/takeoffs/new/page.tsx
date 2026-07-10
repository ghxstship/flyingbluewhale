import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTakeoff } from "./actions";

export const dynamic = "force-dynamic";

const UNITS = ["ea", "lf", "sf", "sy", "cy", "lb", "ton", "hr", "cf", "m", "m2", "m3"];

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: projects }, { data: sheets }, { data: cc }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
    supabase
      .from("site_plans")
      .select("id, code, title")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("code")
      .limit(500),
    supabase.from("cost_codes").select("id, code, name").eq("org_id", session.orgId).order("code").limit(500),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.takeoffs.new.eyebrow", undefined, "Creative")}
        title={t("console.takeoffs.new.title", undefined, "New Takeoff")}
        subtitle={t(
          "console.takeoffs.new.subtitle",
          undefined,
          "A measurement set. Pinned to a drawing sheet for calibrated measurement. Items captured on the detail page.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createTakeoff}
          cancelHref="/studio/takeoffs"
          submitLabel={t("console.takeoffs.new.submit", undefined, "Create Takeoff")}
        >
          <FormField label={t("console.takeoffs.new.fields.name", undefined, "Name")} required>
            <input
              name="name"
              required
              placeholder={t("console.takeoffs.new.placeholders.name", undefined, "Slab-on-grade Level 1")}
              className="ps-input"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("console.takeoffs.new.fields.project", undefined, "Project")} required>
              <select name="project_id" required className="ps-input">
                <option value="">{t("common.selectEllipsis", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t("console.takeoffs.new.fields.unit", undefined, "Unit")} required>
              <select name="unit" required className="ps-input" defaultValue="sf">
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("console.takeoffs.new.fields.sheet", undefined, "Sheet · Optional")}>
              <select name="site_plan_id" className="ps-input">
                <option value="">—</option>
                {((sheets ?? []) as Array<{ id: string; code: string; title: string }>).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t("console.takeoffs.new.fields.costCode", undefined, "Cost Code · Optional")}>
              <select name="cost_code_id" className="ps-input">
                <option value="">—</option>
                {((cc ?? []) as Array<{ id: string; code: string; name: string }>).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField
            label={t("console.takeoffs.new.fields.calibration", undefined, "Calibration (Inches per Foot)")}
            hint={t(
              "console.takeoffs.new.hints.calibration",
              undefined,
              'Drawing scale used by the measurement engine. Common values: 0.0625 (1/16"), 0.125 (1/8"), 0.25 (1/4").',
            )}
          >
            <input
              type="number"
              step="0.001"
              name="calibration_in_per_ft"
              placeholder={t("console.takeoffs.new.placeholders.calibration", undefined, "0.125 for 1/8\" = 1'")}
              className="ps-input"
            />
          </FormField>
          <FormField label={t("console.takeoffs.new.fields.notes", undefined, "Notes")}>
            <textarea name="notes" rows={3} className="ps-input" />
          </FormField>
        </FormShell>
      </div>
    </>
  );
}
