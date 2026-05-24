import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { timeAgo } from "@/lib/format";
import { listMyAssignments, type AssignmentListRow } from "@/lib/db/assignments";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = AssignmentListRow & {
  tier_code: string | null;
  scan_code: string | null;
};

export default async function MyTicketsPage() {
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">My Tickets</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Configure Supabase.</p>
      </div>
    );
  }
  const session = await requireSession();
  const base = await listMyAssignments(session.orgId, session.userId, { kinds: ["ticket"] });

  // Hydrate ticket-specific fields + the active scan code (barcode).
  const supabase = await createClient();
  const ids = base.map((a) => a.id);
  const [{ data: details }, { data: codes }] = ids.length
    ? await Promise.all([
        supabase.from("ticket_assignment_details").select("assignment_id, tier_code").in("assignment_id", ids),
        supabase
          .from("assignment_scan_codes")
          .select("assignment_id, code")
          .in("assignment_id", ids)
          .eq("active", true),
      ])
    : [{ data: [] }, { data: [] }];
  const tierMap = new Map<string, string | null>(
    ((details ?? []) as Array<{ assignment_id: string; tier_code: string | null }>).map((d) => [
      d.assignment_id,
      d.tier_code,
    ]),
  );
  const codeMap = new Map<string, string>(
    ((codes ?? []) as Array<{ assignment_id: string; code: string }>).map((c) => [c.assignment_id, c.code]),
  );

  const rows: Row[] = base.map((a) => ({
    ...a,
    tier_code: tierMap.get(a.id) ?? null,
    scan_code: codeMap.get(a.id) ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Tickets</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Tickets issued to {session.email}</p>
      <div className="mt-6">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No tickets yet"
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{r.scan_code ?? "—"}</span>,
              accessor: (r) => r.scan_code ?? null,
            },
            {
              key: "tier",
              header: "Tier",
              render: (r) => r.tier_code ?? "—",
              accessor: (r) => r.tier_code,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: "State",
              render: (r) => <StatusBadge status={r.fulfillment_state} />,
              accessor: (r) => r.fulfillment_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "issued",
              header: "Issued",
              render: (r) => (r.issued_at ? timeAgo(r.issued_at) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.issued_at,
            },
            {
              key: "redeemed",
              header: "Redeemed",
              render: (r) => (r.fulfilled_at ? timeAgo(r.fulfilled_at) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.fulfilled_at ?? null,
            },
          ]}
        />
      </div>
    </div>
  );
}
