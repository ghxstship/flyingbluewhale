import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Task } from "@/lib/supabase/types";
import { TasksList } from "./TasksList";

export const dynamic = "force-dynamic";

export default async function MobileTasks() {
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24">
        <p className="text-sm text-[var(--text-muted)]">Configure Supabase.</p>
      </div>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("tasks", session.orgId, {
    orderBy: "due_at",
    ascending: true,
    filters: [{ column: "assigned_to", op: "eq", value: session.userId }],
  });
  return <TasksList initial={rows as Task[]} />;
}
