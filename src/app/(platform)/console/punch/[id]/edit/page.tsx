import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updatePunchItem } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const STATUSES = ["open", "in_progress", "ready_for_review", "complete", "void"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

type PunchItem = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  project_id: string;
  priority: (typeof PRIORITIES)[number];
  status: (typeof STATUSES)[number];
  assignee_id: string | null;
  vendor_id: string | null;
  due_at: string | null;
  site_plan_id: string | null;
  show_ready_gate: boolean;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data }, { data: projects }, { data: vendors }, { data: users }, { data: sitePlans }] = await Promise.all([
    supabase
      .from("punch_items")
      .select(
        "id, code, title, description, project_id, priority, status, assignee_id, vendor_id, due_at, site_plan_id, show_ready_gate",
      )
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase.from("projects").select("id, name, updated_at").eq("org_id", session.orgId).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
    supabase.from("site_plans").select("id, code, title").eq("org_id", session.orgId).order("code"),
  ]);

  const item = data as unknown as PunchItem | null;
  if (!item) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title={`Edit Punch Item · ${item.code ?? item.id.slice(0, 8)}`}
        subtitle="Update title, status, assignee, priority, and the show-ready gate."
        breadcrumbs={[
          { label: "Punch List", href: "/console/punch" },
          { label: item.code ?? "Item", href: `/console/punch/${item.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updatePunchItem}
          cancelHref={`/console/punch/${item.id}`}
          submitLabel="Save Punch Item"
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={item.updated_at} />
          <input type="hidden" name="id" value={item.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required defaultValue={item.title} maxLength={200} className={INPUT} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={item.description ?? ""}
              maxLength={4000}
              className={INPUT}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required defaultValue={item.project_id} className={INPUT}>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Site plan pin</span>
              <select name="site_plan_id" defaultValue={item.site_plan_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(sitePlans ?? []).map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.code} · {sp.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Priority</span>
              <select name="priority" defaultValue={item.priority} className={INPUT}>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Status</span>
              <select name="status" defaultValue={item.status} className={INPUT}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Due by</span>
              <input
                type="date"
                name="due_at"
                defaultValue={item.due_at ? item.due_at.slice(0, 10) : ""}
                className={INPUT}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Assignee</span>
              <select name="assignee_id" defaultValue={item.assignee_id ?? ""} className={INPUT}>
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
              <select name="vendor_id" defaultValue={item.vendor_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
            <input
              type="checkbox"
              name="show_ready_gate"
              value="1"
              defaultChecked={item.show_ready_gate}
              className="mt-0.5 accent-[var(--org-primary)]"
            />
            <div>
              <div className="font-medium">Show-ready gate</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                If checked, doors-open is blocked until this item closes.
              </div>
            </div>
          </label>
        </FormShell>
      </div>
    </>
  );
}
