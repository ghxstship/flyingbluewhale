import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import type { GuardTour } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type GuardTourRow = GuardTour;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.guardTours.eyebrow", undefined, "Safety")}
          title={t("console.safety.guardTours.title", undefined, "Guard Tours")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.guardTours.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("guard_tours", session.orgId, {
    orderBy: "next_run_at",
    ascending: true,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows as GuardTourRow[];
  const total = result.totalCount;

  const overdue = rows.filter((r) => r.tour_state === "overdue").length;
  const inProgress = rows.filter((r) => r.tour_state === "in_progress").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.guardTours.eyebrow", undefined, "Safety")}
        title={t("console.safety.guardTours.title", undefined, "Guard Tours")}
        subtitle={
          total === 1
            ? t(
                "console.safety.guardTours.subtitleSingular",
                { count: total, inProgress, overdue },
                `${total} Tour · ${inProgress} in progress · ${overdue} overdue`,
              )
            : t(
                "console.safety.guardTours.subtitlePlural",
                { count: total, inProgress, overdue },
                `${total} Tours · ${inProgress} in progress · ${overdue} overdue`,
              )
        }
        action={
          <Button href="/studio/safety/guard-tours/new" size="sm">
            {t("console.safety.guardTours.scheduleTour", undefined, "+ Schedule tour")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          emptyLabel={t("console.safety.guardTours.emptyLabel", undefined, "No guard tours scheduled")}
          emptyDescription={t(
            "console.safety.guardTours.emptyDescription",
            undefined,
            "Patrol plans live here. Each tour has an ordered route of geofenced checkpoints; mobile patrol scans them in order via /m/guard.",
          )}
          emptyAction={
            <Button href="/studio/safety/guard-tours/new" size="sm">
              {t("console.safety.guardTours.scheduleTour", undefined, "+ Schedule tour")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.safety.guardTours.col.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "cadence",
              header: t("console.safety.guardTours.col.cadence", undefined, "Cadence"),
              render: (r) =>
                r.cadence_minutes
                  ? t(
                      "console.safety.guardTours.cadence.every",
                      { minutes: Number(r.cadence_minutes) },
                      `every ${r.cadence_minutes}m`,
                    )
                  : t("console.safety.guardTours.cadence.adhoc", undefined, "ad-hoc"),
              className: "font-mono text-xs",
              accessor: (r) => r.cadence_minutes ?? null,
            },
            {
              key: "next_run",
              header: t("console.safety.guardTours.col.nextRun", undefined, "Next Run"),
              render: (r) =>
                r.next_run_at
                  ? fmt.dateParts(new Date(String(r.next_run_at)), {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
              className: "font-mono text-xs",
              accessor: (r) => r.next_run_at ?? null,
            },
            {
              key: "tour_state",
              header: t("console.safety.guardTours.col.tour_state", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(String(r.tour_state))}>{toTitle(String(r.tour_state))}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.tour_state ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/guard-tours"
          searchParams={sp}
        />
      </div>
    </>
  );
}
