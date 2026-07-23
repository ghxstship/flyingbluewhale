import Link from "next/link";
import { FileDown } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/components/detail/DetailShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import type { DeliverableType } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

/**
 * <PortalDocVault> — shared per-persona document vault primitive.
 *
 * Reads `deliverables` filtered to the caller's `submitted_by`, scoped
 * to a project + optional `types` filter so each persona can show their
 * relevant kinds (riders for artist, activation specs for sponsor).
 * Rows with an uploaded file link to the signed-URL download endpoint
 * (`/api/v1/deliverables/[id]/download`) — C-14.
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
  file_path: string | null;
};

export async function PortalDocVault({
  projectId,
  types,
  emptyTitle,
  emptyDescription,
}: {
  projectId: string | null;
  types?: DeliverableType[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { t } = await getRequestT();
  const resolvedEmptyTitle = emptyTitle ?? t("p.docVault.empty.title", undefined, "No Documents");
  const resolvedEmptyDescription =
    emptyDescription ??
    t("p.docVault.empty.description", undefined, "Documents tied to you on this project appear here.");
  if (!projectId) {
    return <EmptyState size="compact" title={resolvedEmptyTitle} description={resolvedEmptyDescription} />;
  }
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("deliverables")
    .select("id, title, type, fulfillment_state, version, updated_at, file_path")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("submitted_by", session.userId)
    .is("deleted_at", null);
  if (types && types.length > 0) q = q.in("type", types);
  const { data } = await q.order("updated_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];

  if (rows.length === 0) {
    return <EmptyState size="compact" title={resolvedEmptyTitle} description={resolvedEmptyDescription} />;
  }

  return (
    <table className="ps-table w-full text-sm">
      <thead>
        <tr>
          <th>{t("p.docVault.col.title", undefined, "Title")}</th>
          <th>{t("p.docVault.col.type", undefined, "Type")}</th>
          <th>{t("p.docVault.col.version", undefined, "v")}</th>
          <th>{t("p.docVault.col.state", undefined, "Status")}</th>
          <th>{t("p.docVault.col.updated", undefined, "Updated")}</th>
          <th>
            <span className="sr-only">{t("p.docVault.col.download", undefined, "Download")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const title = r.title ?? t("p.docVault.untitled", undefined, "Untitled");
          return (
            <tr key={r.id}>
              <td>
                {r.file_path ? (
                  <Link href={`/api/v1/deliverables/${r.id}/download`} className="hover:underline">
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </td>
              <td>
                <Badge variant="muted">{toTitle(r.type)}</Badge>
              </td>
              <td className="font-mono">{r.version}</td>
              <td>
                <StatusBadge status={r.fulfillment_state} />
              </td>
              <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
              <td>
                {r.file_path ? (
                  <Link
                    href={`/api/v1/deliverables/${r.id}/download`}
                    className="inline-flex items-center gap-1 text-xs hover:underline"
                    aria-label={t("p.docVault.downloadAria", { title }, `Download ${title}`)}
                  >
                    <FileDown size={12} aria-hidden="true" />
                    {t("p.docVault.download", undefined, "Download")}
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--p-text-2)]">
                    {t("p.docVault.noFile", undefined, "No file yet")}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
