export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("id, number, title, amount_cents, status, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{ id: string; number: string; title: string; amount_cents: number; status: string; created_at: string }>;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Purchase orders" subtitle="Open + paid POs">
      {rows.length === 0 ? (
        <EmptyState title="No purchase orders" description="POs routed to your vendor profile appear here. Ack a PO to move it forward." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>#</th><th>Title</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.number}</td>
                <td>{r.title}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="font-mono text-xs">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
