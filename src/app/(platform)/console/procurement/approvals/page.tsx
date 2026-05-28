export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";

type ApprovalRow = {
  id: string;
  entity_type: "purchase_order" | "requisition" | "expense";
  entity_id: string;
  approval_request_state: "pending" | "approved" | "rejected" | "withdrawn";
  notes: string | null;
  threshold_amount_cents: number | null;
  created_at: string;
  requested_by_user: { id: string; email: string } | null;
  approver_user: { id: string; email: string } | null;
};

const STATE_TONE: Record<string, "info" | "success" | "error" | "muted" | "warning"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  withdrawn: "muted",
};

const ENTITY_LABEL: Record<string, string> = {
  purchase_order: "Purchase Order",
  requisition: "Requisition",
  expense: "Expense",
};

function fmtAmount(cents: number | null): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const sp = await searchParams;
  const stateFilter = sp.state ?? "pending";

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Approvals" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const query = supabase
    .from("approval_requests")
    .select("id, entity_type, entity_id, approval_request_state, notes, threshold_amount_cents, created_at, requested_by_user:requested_by(id, email), approver_user:approver_id(id, email)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (stateFilter !== "all") {
    query.eq("approval_request_state", stateFilter);
  }

  const [{ data: rawRows }, { data: allRows }] = await Promise.all([
    query,
    supabase
      .from("approval_requests")
      .select("approval_request_state")
      .eq("org_id", session.orgId),
  ]);

  const rows = (rawRows ?? []) as ApprovalRow[];
  const all = (allRows ?? []) as Array<{ approval_request_state: string }>;
  const pendingCount = all.filter((r) => r.approval_request_state === "pending").length;
  const approvedCount = all.filter((r) => r.approval_request_state === "approved").length;
  const rejectedCount = all.filter((r) => r.approval_request_state === "rejected").length;

  const filters: Array<{ label: string; value: string }> = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Approvals"
        subtitle="Review and resolve PO, requisition, and expense approval requests."
        breadcrumbs={[{ label: "Procurement", href: "/console/procurement" }, { label: "Approvals" }]}
      />
      <div className="page-content">
        <div className="metric-grid mb-6">
          <MetricCard label="Pending" value={pendingCount} tone="warning" />
          <MetricCard label="Approved" value={approvedCount} tone="success" />
          <MetricCard label="Rejected" value={rejectedCount} tone="error" />
        </div>

        <div className="flex gap-2 mb-4">
          {filters.map((f) => (
            <Button
              key={f.value}
              href={`/console/procurement/approvals?state=${f.value}`}
              variant={stateFilter === f.value ? "primary" : "secondary"}
              size="sm"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No requests" description={`No ${stateFilter === "all" ? "" : stateFilter + " "}approval requests found.`} />
        ) : (
          <div className="surface overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Requested by</th>
                  <th className="w-28">Amount</th>
                  <th>Notes</th>
                  <th className="w-24">State</th>
                  <th className="w-32">Created</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{ENTITY_LABEL[row.entity_type] ?? row.entity_type}</td>
                    <td className="text-sm">{row.requested_by_user?.email ?? "—"}</td>
                    <td className="tabular-nums">{fmtAmount(row.threshold_amount_cents)}</td>
                    <td className="text-sm text-[var(--color-text-muted)] max-w-xs truncate">{row.notes ?? "—"}</td>
                    <td>
                      <Badge tone={STATE_TONE[row.approval_request_state] ?? "muted"}>
                        {row.approval_request_state.charAt(0).toUpperCase() + row.approval_request_state.slice(1)}
                      </Badge>
                    </td>
                    <td className="text-sm tabular-nums">
                      {new Date(row.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                    </td>
                    <td>
                      <Button href={`/console/procurement/approvals/${row.id}`} size="sm" variant="ghost">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
