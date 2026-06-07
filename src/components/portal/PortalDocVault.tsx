import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/components/detail/DetailShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DeliverableType } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

/**
 * <PortalDocVault> — shared per-persona document vault primitive.
 *
 * Reads `deliverables` filtered to the caller's `submitted_by`, scoped
 * to a project + optional `types` filter so each persona can show their
 * relevant kinds (riders for artist, activation specs for sponsor).
 *
 * Per-individual catalog entitlements (tickets, credentials, lodging,
 * etc.) no longer live in deliverables — they're in the unified
 * `assignments` table, surfaced via /m/advances and /p/[slug]/crew/advances.
 * This widget only renders *documents the user submitted* now.
 */

type Row = {
  id: string;
  title: string | null;
  type: string;
  fulfillment_state: string;
  version: number;
  updated_at: string;
};

export async function PortalDocVault({
  projectId,
  types,
  emptyTitle = "No Documents",
  emptyDescription = "Documents tied to you on this project appear here.",
}: {
  projectId: string | null;
  types?: DeliverableType[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!projectId) {
    return <EmptyState size="compact" title={emptyTitle} description={emptyDescription} />;
  }
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("deliverables")
    .select("id, title, type, fulfillment_state, version, updated_at")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("submitted_by", session.userId)
    .is("deleted_at", null);
  if (types && types.length > 0) q = q.in("type", types);
  const { data } = await q.order("updated_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];

  if (rows.length === 0) {
    return <EmptyState size="compact" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <table className="ps-table w-full text-sm">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>v</th>
          <th>State</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.title ?? "Untitled"}</td>
            <td>
              <Badge variant="muted">{toTitle(r.type)}</Badge>
            </td>
            <td className="font-mono">{r.version}</td>
            <td>
              <StatusBadge status={r.fulfillment_state} />
            </td>
            <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
