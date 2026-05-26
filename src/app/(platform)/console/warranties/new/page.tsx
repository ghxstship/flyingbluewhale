import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createWarranty } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: projects }, { data: vendors }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);

  return (
    <>
      <ModuleHeader eyebrow="Closeout" title="New Warranty" />
      <div className="page-content max-w-2xl">
        <FormShell action={createWarranty} cancelHref="/console/warranties" submitLabel="Create Warranty">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Coverage name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="HVAC system — Trane RT-3" className={INPUT} />
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
              <span className={LBL}>Vendor / Warrantor</span>
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
                Start<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="date" name="start_date" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                End<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="date" name="end_date" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Duration (months)</span>
              <input type="number" min="1" name="duration_months" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Warrantor email</span>
              <input type="email" name="warrantor_email" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Warrantor phone</span>
              <input name="warrantor_phone" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Coverage summary (Markdown)</span>
            <textarea name="coverage_summary_md" rows={4} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
