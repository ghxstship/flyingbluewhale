import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createDailyLog } from "./actions";

export const dynamic = "force-dynamic";

const INPUT_CLS = "input-base focus-ring";
const LABEL_CLS = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .in("status", ["active", "draft"])
    .order("name");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="New Daily Log"
        subtitle="One entry per project per day. Captures weather, manpower, equipment, and notes."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createDailyLog} cancelHref="/console/operations/daily-log" submitLabel="Create Log">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>
              Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="project_id" required className={INPUT_CLS}>
              <option value="">Select a project…</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>
              Date<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input type="date" name="log_date" defaultValue={today} required className={INPUT_CLS} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>Weather summary</span>
            <input name="weather_summary" placeholder="e.g. Sunny, 78°F, light breeze" className={INPUT_CLS} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>Temp high (°F)</span>
              <input type="number" step="any" name="weather_temp_high_f" className={INPUT_CLS} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>Temp low (°F)</span>
              <input type="number" step="any" name="weather_temp_low_f" className={INPUT_CLS} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLS}>Notes</span>
            <textarea
              name="notes"
              rows={4}
              placeholder="Site narrative, deliveries, visitors, milestones reached, blockers…"
              className={INPUT_CLS}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
