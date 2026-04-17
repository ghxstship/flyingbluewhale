import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Task } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MobileTasks() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24"><p className="text-sm text-[var(--text-muted)]">Configure Supabase.</p></div>;
  }
  const session = await requireSession();
  const rows = await listOrgScoped("tasks", session.orgId, {
    orderBy: "due_at",
    ascending: true,
    filters: [{ column: "assigned_to", op: "eq", value: session.userId }],
  });
  const open = rows.filter((r: Task) => r.status !== "done");
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">My tasks</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{open.length} open · {rows.length - open.length} done</p>
      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div className="surface p-5 text-center text-sm text-[var(--text-muted)]">No tasks assigned</div>
        ) : (
          rows.map((t: Task) => (
            <li key={t.id}>
              <Link href={`/console/tasks/${t.id}`} className="surface-raised flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">Due {formatDate(t.due_at, "medium")}</div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
