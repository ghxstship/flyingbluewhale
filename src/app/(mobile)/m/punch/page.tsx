import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  todo: "warning",
  in_progress: "info",
  blocked: "warning",
  review: "info",
  done: "success",
};

const PRIORITY_LABEL: Record<number, string> = {
  1: "P1",
  2: "P2",
  3: "P3",
};

export default async function MobilePunchPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("assigned_to", session.userId)
    .neq("status", "done")
    .order("priority", { ascending: true })
    .order("due_at", { ascending: true })
    .limit(50);
  const rows = (data ?? []) as unknown as TaskRow[];

  const overdueCount = rows.filter(
    (r) => r.due_at && new Date(r.due_at).getTime() < Date.now() - 24 * 60 * 60 * 1000,
  ).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Punch List</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? "No open items assigned to you."
          : `${rows.length} open${overdueCount ? ` · ${overdueCount} overdue` : ""}`}
      </p>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="Punch List Clear"
              description="Open items assigned to you appear here. Visit Tasks on desktop to assign new ones."
              action={
                <Link href={urlFor("platform", "/tasks")} className="btn btn-secondary btn-sm">
                  Open Tasks
                </Link>
              }
            />
          </li>
        ) : (
          rows.map((r) => {
            const overdue = r.due_at && new Date(r.due_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;
            return (
              <li key={r.id} className="surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-snug font-semibold">{r.title}</div>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{r.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="muted">{PRIORITY_LABEL[r.priority] ?? `P${r.priority}`}</Badge>
                      {r.project?.name && <Badge variant="muted">{r.project.name}</Badge>}
                      {overdue && <Badge variant="error">Overdue</Badge>}
                      {r.due_at && !overdue && <Badge variant="muted">Due {r.due_at}</Badge>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
