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
    .from("invoices")
    .select("id, number, title, amount_cents, status, issued_at, due_at")
    .eq("org_id", session.orgId)
    .eq("created_by", session.userId)
    .order("issued_at", { ascending: false });
  const rows = (data ?? []) as Array<{ id: string; number: string | null; title: string | null; amount_cents: number; status: string; issued_at: string | null; due_at: string | null }>;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Invoices" subtitle="Your invoices against this org">
      {rows.length === 0 ? (
        <EmptyState title="No invoices yet" description="Submit an invoice through the console or API. Paid invoices route through Stripe Connect." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>#</th><th>Title</th><th>Amount</th><th>Status</th><th>Issued</th><th>Due</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.number ?? r.id.slice(0, 8)}</td>
                <td>{r.title ?? "—"}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="font-mono text-xs">{fmtDate(r.issued_at)}</td>
                <td className="font-mono text-xs">{fmtDate(r.due_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
