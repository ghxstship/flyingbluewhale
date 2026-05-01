import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  kind: string;
  record_id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  owner_id: string | null;
  due_at: string | null;
  status: string;
  priority: string;
  created_at: string;
};

const KIND_HREF: Record<string, (id: string) => string> = {
  rfi: (id) => `/console/rfis/${id}`,
  submittal: (id) => `/console/submittals/${id}`,
  punch: (id) => `/console/punch/${id}`,
  inspection: (id) => `/console/inspections/${id}`,
  task: (id) => `/console/tasks/${id}`,
};

const KIND_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  rfi: "info",
  submittal: "info",
  punch: "warning",
  inspection: "info",
  task: "muted",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("v_action_items")
    .select("*")
    .eq("org_id", session.orgId)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (sp.mine === "1") q = q.eq("owner_id", session.userId);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const overdue = rows.filter((r) => r.due_at && new Date(r.due_at) < new Date()).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Workspace"
        title="Action Items"
        subtitle="Cross-module ball-in-court rollup — RFIs, submittals, punch, inspections, tasks."
        action={
          <a
            href={sp.mine === "1" ? "/console/action-items" : "/console/action-items?mine=1"}
            className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {sp.mine === "1" ? "All" : "Mine only"}
          </a>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open Items" value={rows.length.toLocaleString()} accent />
          <MetricCard label="Overdue" value={overdue.toLocaleString()} />
          <MetricCard label="Across Kinds" value={Object.keys(byKind).length.toString()} />
        </div>
        <section className="surface p-4">
          {rows.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Nothing open. Inbox zero.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.kind}-${r.record_id}`}>
                    <td>
                      <Badge variant={KIND_TONE[r.kind] ?? "muted"}>{r.kind}</Badge>
                    </td>
                    <td>
                      <a href={(KIND_HREF[r.kind] ?? ((id) => `#${id}`))(r.record_id)} className="hover:underline">
                        {r.title}
                      </a>
                    </td>
                    <td>{r.status.replace(/_/g, " ")}</td>
                    <td
                      className={`font-mono text-xs ${r.due_at && new Date(r.due_at) < new Date() ? "text-[var(--color-error)]" : ""}`}
                    >
                      {fmt(r.due_at)}
                    </td>
                    <td>{r.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
