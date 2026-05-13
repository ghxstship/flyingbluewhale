import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { AuditLogViewer } from "./AuditLogViewer";
import type { AuditLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Audit Log" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Settings"
        title="Workspace Settings"
        subtitle={`Audit log · showing ${showingFrom}–${showingTo} of ${page.totalCount}`}
      />
      <div className="page-content max-w-6xl space-y-3">
        <AuditLogViewer rows={rows} />
        <nav className="flex items-center justify-between text-xs">
          {offset > 0 ? (
            <Link
              href={
                offset - PAGE_SIZE <= 0
                  ? "/console/settings/audit"
                  : `/console/settings/audit?cursor=${offset - PAGE_SIZE}`
              }
              className="text-[var(--org-primary)] hover:underline"
            >
              ← Newer
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {page.nextCursor ? (
            <Link
              href={`/console/settings/audit?cursor=${page.nextCursor}`}
              className="text-[var(--org-primary)] hover:underline"
            >
              Older →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      </div>
    </>
  );
}
