import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createTakeoff } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const UNITS = ["ea", "lf", "sf", "sy", "cy", "lb", "ton", "hr", "cf", "m", "m2", "m3"];

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
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
        eyebrow="Creative"
        title="New Takeoff"
        subtitle="A measurement set. Pinned to a drawing sheet for calibrated measurement. Items captured on the detail page."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createTakeoff} cancelHref="/console/takeoffs" submitLabel="Create Takeoff">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="Slab-on-grade Level 1" className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
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
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Unit<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="unit" required className={INPUT} defaultValue="sf">
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Sheet (optional)</span>
              <select name="site_plan_id" className={INPUT}>
                <option value="">—</option>
                {((sheets ?? []) as Array<{ id: string; code: string; title: string }>).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Cost code (optional)</span>
              <select name="cost_code_id" className={INPUT}>
                <option value="">—</option>
                {((cc ?? []) as Array<{ id: string; code: string; name: string }>).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Calibration (inches per foot)</span>
            <input
              type="number"
              step="0.001"
              name="calibration_in_per_ft"
              placeholder="0.125 for 1/8&quot; = 1'"
              className={INPUT}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              Drawing scale used by the measurement engine. Common values: 0.0625 (1/16&quot;), 0.125 (1/8&quot;), 0.25
              (1/4&quot;).
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
