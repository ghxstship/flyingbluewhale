import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/components/detail/DetailShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DeliverableType } from "@/lib/supabase/types";

/**
 * <PortalDocVault> — shared per-persona document vault primitive.
 *
 * The portal had bespoke vault-style surfaces on vendor/submissions
 * (deliverables they submitted), client/files (proposal collateral),
 * and sponsor/assets — but each was reimplemented with slightly
 * different shapes. This widget reads `deliverables` (the canonical
 * document table) filtered to the caller's `assignee_id` AND/OR
 * `submitted_by`, scoped to a project + optional `types` filter so
 * each persona can show their relevant kinds (riders for artist,
 * activation specs for sponsor, etc).
 *
 * For per-persona doc surfaces that don't yet exist (artist riders,
 * media credentials, delegation visa docs), mount this with the
 * relevant types[] to give them a vault view without writing new
 * server logic.
 */

type Row = {
  id: string;
  title: string | null;
  type: string;
  deliverable_state: string;
  version: number;
  updated_at: string;
};

export async function PortalDocVault({
  projectId,
  types,
  showSubmittedByMe = true,
  emptyTitle = "No Documents",
  emptyDescription = "Documents tied to you on this project appear here.",
}: {
  projectId: string | null;
  types?: DeliverableType[];
  showSubmittedByMe?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!projectId) {
    return <EmptyState size="compact" title={emptyTitle} description={emptyDescription} />;
  }
  const session = await requireSession();
  const supabase = await createClient();

  // `submitted_by` (legacy) OR `assignee_id` (per-individual, 0049) — the
  // OR captures both "things I sent in" and "things assigned to me".
  const filters: string[] = [`assignee_id.eq.${session.userId}`];
  if (showSubmittedByMe) filters.push(`submitted_by.eq.${session.userId}`);
  let q = supabase
    .from("deliverables")
    .select("id, title, type, deliverable_state, version, updated_at")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .or(filters.join(","))
    .is("deleted_at", null);
  if (types && types.length > 0) q = q.in("type", types);
  const { data } = await q.order("updated_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];

  if (rows.length === 0) {
    return <EmptyState size="compact" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <table className="data-table w-full text-sm">
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
              <Badge variant="muted">{r.type.replace(/_/g, " ")}</Badge>
            </td>
            <td className="font-mono">{r.version}</td>
            <td>
              <StatusBadge status={r.deliverable_state} />
            </td>
            <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
