export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  let rows: Array<{ id: string; amount_cents: number; status: string; reason: string | null; requested_at: string }> = [];
  if (project) {
    const { data } = await supabase
      .from("advances")
      .select("id, amount_cents, status, reason, requested_at")
      .eq("project_id", project.id)
      .eq("requester_id", session.userId)
      .order("requested_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  }
  return (
    <PortalSubpage slug={slug} persona="crew" title="Advances" subtitle="Per-diem + expense advances for this project">
      {rows.length === 0 ? (
        <EmptyState title="No advances yet" description="Request an advance through your crew lead. Approved advances show up here." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>When</th><th>Amount</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{fmtDate(r.requested_at)}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td className="text-[var(--text-muted)]">{r.reason ?? "—"}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
