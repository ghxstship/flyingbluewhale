import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Ticket } from "@/lib/supabase/types";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  if (!hasSupabase) {
    return <div><h1 className="text-2xl font-semibold">My tickets</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Configure Supabase.</p></div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("holder_email", session.email)
    .order("issued_at", { ascending: false });
  const rows = (data ?? []) as Ticket[];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My tickets</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Tickets issued to {session.email}</p>
      <div className="mt-6">
        <DataTable<Ticket>
          rows={rows}
          emptyLabel="No tickets yet"
          columns={[
            { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: "tier", header: "Tier", render: (r) => r.tier },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "issued", header: "Issued", render: (r) => timeAgo(r.issued_at), className: "font-mono text-xs" },
            { key: "scanned", header: "Scanned", render: (r) => r.scanned_at ? timeAgo(r.scanned_at) : "—", className: "font-mono text-xs" },
          ]}
        />
      </div>
    </div>
  );
}
