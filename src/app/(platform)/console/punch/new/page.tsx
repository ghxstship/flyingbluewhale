import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { createPunchItem } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: projects }, { data: users }, { data: vendors }, { data: plans }, { data: lists }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("site_plans").select("id, code, title").eq("org_id", session.orgId).order("code"),
    supabase
      .from("punch_lists")
      .select("id, name, project_id, status")
      .eq("org_id", session.orgId)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="New Punch Item"
        subtitle="Show-ready gap. Gate doors-open when needed."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createPunchItem} cancelHref="/console/punch" submitLabel="Create Item">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required placeholder="Cable cover missing on stage-left run" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">Select…</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Priority</span>
              <select name="priority" className={INPUT} defaultValue="normal">
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {toTitle(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Assignee</span>
              <select name="assignee_id" className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Vendor</span>
              <select name="vendor_id" className={INPUT}>
                <option value="">—</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Due date</span>
              <input type="date" name="due_at" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Site plan</span>
              <select name="site_plan_id" className={INPUT}>
                <option value="">—</option>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Punch list</span>
            <select name="punch_list_id" className={INPUT} defaultValue="">
              <option value="">— Unassigned —</option>
              {((lists ?? []) as Array<{ id: string; name: string; project_id: string }>).map((l) => (
                <option key={l.id} value={l.id} data-project={l.project_id}>
                  {l.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[var(--text-muted)]">
              Optional. Pick a list to group this item with others. The server enforces that the list&rsquo;s project
              matches the item&rsquo;s.
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="show_ready_gate" value="1" />
            <span className="text-xs">Gate doors-open until this item is closed</span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
