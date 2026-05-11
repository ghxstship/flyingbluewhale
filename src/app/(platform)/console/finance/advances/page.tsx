import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

type AdvanceRow = {
  id: string;
  project_id: string | null;
  crew_member_id: string | null;
  requester_name: string | null;
  amount_cents: number;
  currency: string;
  purpose: string | null;
  status: string;
  approved_by: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "muted"> = {
  approved: "success",
  paid: "success",
  pending: "warning",
  requested: "warning",
  rejected: "error",
  cancelled: "error",
  voided: "muted",
};

function cents(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n / 100);
}

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Advances" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;

  const { data: rows, error } = await loose
    .from("advances")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const advances: AdvanceRow[] = error ? [] : (rows ?? []);

  const totalPending = advances
    .filter((a) => ["pending", "requested"].includes(a.status))
    .reduce((s, a) => s + a.amount_cents, 0);

  const totalPaid = advances
    .filter((a) => a.status === "paid")
    .reduce((s, a) => s + a.amount_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Advances"
        subtitle={`${advances.length} advance request${advances.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/finance/advances/new" size="sm">
            + Request Advance
          </Button>
        }
      />
      <div className="page-content space-y-4">
        {/* Summary metrics */}
        {advances.length > 0 && (
          <div className="metric-grid">
            <div className="surface p-4">
              <div className="text-xs text-[var(--text-muted)]">Pending approval</div>
              <div className="mt-1 text-xl font-bold tabular-nums text-[var(--color-warning)]">
                {cents(totalPending)}
              </div>
            </div>
            <div className="surface p-4">
              <div className="text-xs text-[var(--text-muted)]">Total paid out</div>
              <div className="mt-1 text-xl font-bold tabular-nums text-[var(--color-success)]">
                {cents(totalPaid)}
              </div>
            </div>
            <div className="surface p-4">
              <div className="text-xs text-[var(--text-muted)]">Total requests</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{advances.length}</div>
            </div>
          </div>
        )}

        {/* Table */}
        {advances.length === 0 ? (
          <EmptyState
            title="No advances yet"
            description="Cash advances track per-diem and emergency funds disbursed to crew and staff. Request an advance to get started."
            action={
              <Button href="/console/finance/advances/new" size="sm">
                + Request Advance
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-hidden">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="text-sm font-medium">{a.requester_name ?? "—"}</span>
                    </td>
                    <td>
                      <span className="text-sm text-[var(--text-secondary)]">{a.purpose ?? "—"}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm tabular-nums">
                        {cents(a.amount_cents, a.currency)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={STATUS_VARIANT[a.status] ?? "muted"} size="sm">
                        {a.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {a.paid_at
                          ? new Date(a.paid_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
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
