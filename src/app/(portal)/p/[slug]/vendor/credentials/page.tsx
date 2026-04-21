export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("id, kind, number, issued_on, expires_on, file_path")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true, nullsFirst: false });
  const items = (data ?? []) as Array<{ id: string; kind: string; number: string | null; issued_on: string | null; expires_on: string | null; file_path: string | null }>;
  const now = Date.now();
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Credentials" subtitle="COI, W-9, safety cards">
      {items.length === 0 ? (
        <EmptyState title="No credentials on file" description="Upload a COI and W-9 before your first invoice. Expired credentials block payouts." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>Kind</th><th>Number</th><th>Issued</th><th>Expires</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((c) => {
              const expiresAt = c.expires_on ? new Date(c.expires_on).getTime() : Infinity;
              const state = expiresAt < now ? "expired" : (expiresAt - now < 30 * 864e5 ? "expiring" : "active");
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.kind}</td>
                  <td className="font-mono text-xs">{c.number ?? "—"}</td>
                  <td className="font-mono text-xs">{fmtDate(c.issued_on)}</td>
                  <td className="font-mono text-xs">{fmtDate(c.expires_on)}</td>
                  <td>
                    <StatusChip
                      tone={state === "expired" ? "danger" : state === "expiring" ? "warning" : "success"}
                    >
                      {state}
                    </StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
