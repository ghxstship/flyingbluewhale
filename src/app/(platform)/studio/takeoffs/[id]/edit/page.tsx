import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateTakeoff, type State } from "./actions";

export const dynamic = "force-dynamic";

const UNITS = ["ea", "lf", "sf", "sy", "cy", "lb", "ton", "hr", "cf", "m", "m2", "m3"];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("takeoffs", session.orgId, id);
  if (!row) notFound();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const [{ data: sheets }, { data: cc }] = await Promise.all([
    supabase
      .from("site_plans")
      .select("id, code, title")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("code")
      .limit(500),
    supabase.from("cost_codes").select("id, code, name").eq("org_id", session.orgId).order("code").limit(500),
  ]);
  const action = updateTakeoff.bind(null, id) as unknown as (state: State, fd: FormData) => Promise<State>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.takeoffs.edit.eyebrow", undefined, "Creative")}
        title={t("console.takeoffs.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={action}
          cancelHref={`/studio/takeoffs/${id}`}
          submitLabel={t("console.takeoffs.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.takeoffs.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <FormField label={t("console.takeoffs.edit.fields.unit", undefined, "Unit")} required>
            <select name="unit" required className="ps-input" defaultValue={row.unit}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("console.takeoffs.edit.fields.sheet", undefined, "Sheet · Optional")}>
              <select name="site_plan_id" className="ps-input" defaultValue={row.site_plan_id ?? ""}>
                <option value="">—</option>
                {((sheets ?? []) as Array<{ id: string; code: string; title: string }>).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t("console.takeoffs.edit.fields.costCode", undefined, "Cost Code · Optional")}>
              <select name="cost_code_id" className="ps-input" defaultValue={row.cost_code_id ?? ""}>
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
            label={t("console.takeoffs.edit.fields.calibration", undefined, "Calibration (Inches per Foot)")}
            hint={t(
              "console.takeoffs.edit.hints.calibration",
              undefined,
              'Drawing scale used by the measurement engine. Common values: 0.0625 (1/16"), 0.125 (1/8"), 0.25 (1/4").',
            )}
          >
            <input
              type="number"
              step="0.001"
              name="calibration_in_per_ft"
              defaultValue={row.calibration_in_per_ft ?? ""}
              className="ps-input"
            />
          </FormField>
          <FormField label={t("console.takeoffs.edit.fields.notes", undefined, "Notes")}>
            <textarea name="notes" rows={3} defaultValue={row.notes ?? ""} className="ps-input" />
          </FormField>
        </FormShell>
      </div>
    </>
  );
}
