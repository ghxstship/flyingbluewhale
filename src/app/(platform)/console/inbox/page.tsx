import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  if (!hasSupabase) return <><ModuleHeader title="Inbox" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as Notification[];
  const unread = rows.filter((r) => !r.read_at).length;
  return (
    <>
      <ModuleHeader eyebrow="Collaboration" title="Inbox" subtitle={`${unread} unread · ${rows.length} total`} />
      <div className="page-content">
        <DataTable<Notification>
          rows={rows}
          emptyLabel="You're all caught up"
          columns={[
            { key: "status", header: "", render: (r) => r.read_at ? <Badge variant="muted">read</Badge> : <Badge variant="brand">new</Badge> },
            { key: "title", header: "Subject", render: (r) => r.title },
            { key: "body", header: "Body", render: (r) => <span className="text-[var(--text-secondary)]">{r.body ?? "—"}</span> },
            { key: "when", header: "When", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
