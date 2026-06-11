import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { GuardTour } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type GuardTourRow = GuardTour;

export default async function Page() {
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
  const rows = (await listOrgScoped("guard_tours", session.orgId, {
    orderBy: "next_run_at",
    ascending: true,
    limit: 500,
  })) as GuardTourRow[];

  const overdue = rows.filter((r) => r.tour_state === "overdue").length;
  const inProgress = rows.filter((r) => r.tour_state === "in_progress").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.guardTours.eyebrow", undefined, "Safety")}
        title={t("console.safety.guardTours.title", undefined, "Guard Tours")}
        subtitle={
          rows.length === 1
            ? t(
                "console.safety.guardTours.subtitleSingular",
                { count: rows.length, inProgress, overdue },
                `${rows.length} Tour · ${inProgress} in progress · ${overdue} overdue`,
              )
            : t(
                "console.safety.guardTours.subtitlePlural",
                { count: rows.length, inProgress, overdue },
                `${rows.length} Tours · ${inProgress} in progress · ${overdue} overdue`,
              )
        }
        action={
          <Button href="/console/safety/guard-tours/new" size="sm">
            {t("console.safety.guardTours.scheduleTour", undefined, "+ Schedule tour")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel={t("console.safety.guardTours.emptyLabel", undefined, "No guard tours scheduled")}
          emptyDescription={t(
            "console.safety.guardTours.emptyDescription",
            undefined,
            "Patrol plans live here. Each tour has an ordered route of geofenced checkpoints; mobile patrol scans them in order via /m/guard.",
          )}
          emptyAction={
            <Button href="/console/safety/guard-tours/new" size="sm">
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
                  ? new Date(String(r.next_run_at)).toLocaleString(undefined, {
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
      </div>
    </>
  );
}
