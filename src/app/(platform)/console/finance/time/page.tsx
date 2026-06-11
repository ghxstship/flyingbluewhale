import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { TimeEntry } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/** Narrow, uncapped aggregate source for the header total. */
async function timeEntryDurations(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("time_entries").select("duration_minutes").eq("org_id", orgId);
  if (error) throw error;
  return data ?? [];
}

function fmtMinutes(m: number | null) {
  if (!m) return "—";
  const h = Math.floor(m / 60),
    mm = m % 60;
  return `${h}h ${mm}m`;
}

const PAGE_SIZE = 100;

export default async function TimePage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.time.title", undefined, "Time Tracking")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.time.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  // Header totals come from an exact count + a narrow uncapped query —
  // the table rows below are cursor-paginated (SC-2), but reducing over
  // a capped list truncated the logged-minutes total once an org passed
  // the cap, so the aggregate stays on its own narrow query.
  const [page, durations] = await Promise.all([
    listOrgScopedPage("time_entries", session.orgId, {
      orderBy: "started_at",
      pageSize: PAGE_SIZE,
      cursor: sp?.cursor ?? null,
    }),
    timeEntryDurations(session.orgId),
  ]);
  const rows = page.rows;
  const count = page.totalCount;
  const offset = sp?.cursor ? Number(sp.cursor) : 0;
  const totalMin = durations.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.time.eyebrow", undefined, "Finance")}
        title={t("console.finance.time.title", undefined, "Time Tracking")}
        subtitle={t(
          "console.finance.time.subtitle",
          { count, duration: fmtMinutes(totalMin) },
          `${count} Entries  · ${fmtMinutes(totalMin)} logged`,
        )}
        action={
          <Button href="/console/finance/time/new">
            {t("console.finance.time.newEntry", undefined, "+ New Entry")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable<TimeEntry>
          rows={rows}
          totalCount={count}
          rowHref={(r) => `/console/finance/time/${r.id}`}
          emptyLabel={t("console.finance.time.emptyLabel", undefined, "No time entries")}
          emptyDescription={t(
            "console.finance.time.emptyDescription",
            undefined,
            "Track billable + non-billable work for invoices and labour cost reporting.",
          )}
          emptyAction={
            <Button href="/console/finance/time/new" size="sm">
              {t("console.finance.time.newEntry", undefined, "+ New Entry")}
            </Button>
          }
          columns={[
            {
              key: "description",
              header: t("console.finance.time.columns.description", undefined, "Description"),
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "duration",
              header: t("console.finance.time.columns.duration", undefined, "Duration"),
              render: (r) => fmtMinutes(r.duration_minutes),
              className: "font-mono text-xs",
              accessor: (r) => r.duration_minutes ?? null,
            },
            {
              key: "billable",
              header: t("console.finance.time.columns.billable", undefined, "Billable"),
              render: (r) =>
                r.billable ? (
                  <Badge variant="success">{t("common.yes", undefined, "Yes")}</Badge>
                ) : (
                  <Badge variant="muted">{t("common.no", undefined, "No")}</Badge>
                ),
              accessor: (r) => r.billable ?? null,
            },
            {
              key: "started",
              header: t("console.finance.time.columns.started", undefined, "Started"),
              render: (r) => timeAgo(r.started_at),
              className: "font-mono text-xs",
              accessor: (r) => r.started_at,
            },
          ]}
        />
        {(offset > 0 || page.nextCursor) && (
          <nav className="flex items-center justify-between text-xs">
            {offset > 0 ? (
              <Link
                href={
                  offset - PAGE_SIZE <= 0
                    ? "/console/finance/time"
                    : `/console/finance/time?cursor=${offset - PAGE_SIZE}`
                }
                className="text-[var(--brand-color)] hover:underline"
              >
                {t("console.finance.time.newer", undefined, "← Newer")}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {page.nextCursor ? (
              <Link
                href={`/console/finance/time?cursor=${page.nextCursor}`}
                className="text-[var(--brand-color)] hover:underline"
              >
                {t("console.finance.time.older", undefined, "Older →")}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
