import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate, timeAgo } from "@/lib/format";
import type { Task } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  if (!hasSupabase) return <><ModuleHeader title="Tasks" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("tasks", session.orgId, { orderBy: "due_at", ascending: true });
  const open = rows.filter((r) => r.status !== "done").length;
  return (
    <>
      <ModuleHeader eyebrow="Work" title="Tasks" subtitle={`${open} open · ${rows.length - open} done`}
        action={<Button href="/console/tasks/new">+ New task</Button>} />
      <div className="page-content">
        <DataTable<Task>
          rows={rows}
          rowHref={(r) => `/console/tasks/${r.id}`}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "priority", header: "P", render: (r) => <span className="font-mono text-xs">P{r.priority}</span> },
            { key: "due", header: "Due", render: (r) => formatDate(r.due_at, "medium"), className: "font-mono text-xs" },
            { key: "created", header: "Created", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
