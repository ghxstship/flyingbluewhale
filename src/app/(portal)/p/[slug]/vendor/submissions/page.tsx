export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, title, type, status, version, updated_at")
    .eq("org_id", session.orgId)
    .eq("submitted_by", session.userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{ id: string; title: string | null; type: string; status: string; version: number; updated_at: string }>;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Submissions" subtitle="What you've sent in">
      {rows.length === 0 ? (
        <EmptyState title="No submissions yet" description="Deliverables you submit via Advancing appear here with their review status." />
      ) : (
        <table className="data-table w-full text-sm">
          <thead><tr><th>Title</th><th>Type</th><th>v</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title ?? "Untitled"}</td>
                <td className="font-mono text-xs">{r.type}</td>
                <td className="font-mono text-xs">{r.version}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
