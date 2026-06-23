import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DownloadLink } from "@/components/DownloadLink";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { AuditLogViewer } from "./AuditLogViewer";
import type { AuditLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.settings.audit.title", undefined, "Audit Log")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.audit.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const sp = await searchParams;
  const session = await requireSession();
  // Sea Trial FINDING-013: pre-fix shipped 500 rows inline → 597 KB HTML.
  // Cursor-paginate at 100 rows/page; "older" link advances offset.
  const page = await listOrgScopedPage("audit_log", session.orgId, {
    orderBy: "at",
    ascending: false,
    pageSize: PAGE_SIZE,
    cursor: sp?.cursor ?? null,
  });
  const rows = page.rows as AuditLog[];
  const offset = sp?.cursor ? Number(sp.cursor) : 0;
  const showingFrom = page.totalCount === 0 ? 0 : offset + 1;
  const showingTo = offset + rows.length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.workspaceTitle", undefined, "Workspace Settings")}
        subtitle={t(
          "console.settings.audit.subtitle",
          { from: showingFrom, to: showingTo, total: page.totalCount },
          `Audit Log · ${showingFrom}–${showingTo} of ${page.totalCount}`,
        )}
        action={
          <DownloadLink href="/api/v1/compliance/audit-export">
            {t("console.settings.audit.export", undefined, "Export")}
          </DownloadLink>
        }
      />
      <div className="page-content max-w-6xl space-y-3">
        <AuditLogViewer rows={rows} />
        <nav className="flex items-center justify-between text-xs">
          {offset > 0 ? (
            <Link
              href={
                offset - PAGE_SIZE <= 0
                  ? "/studio/settings/audit"
                  : `/studio/settings/audit?cursor=${offset - PAGE_SIZE}`
              }
              className="text-[var(--brand-color)] hover:underline"
            >
              {t("console.settings.audit.newer", undefined, "← Newer")}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {page.nextCursor ? (
            <Link
              href={`/studio/settings/audit?cursor=${page.nextCursor}`}
              className="text-[var(--brand-color)] hover:underline"
            >
              {t("console.settings.audit.older", undefined, "Older →")}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      </div>
    </>
  );
}
