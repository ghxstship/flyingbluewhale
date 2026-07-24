import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";
import type { Department, PositionRow } from "./PositionForm";
import { OrgChartView, type ChartPositionRow, type SeatHolder } from "./OrgChartView";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Organization pillar: the position library, hub-native (full CRUD here).
 * Positions are classed by XPMS department (dim_department); the reporting
 * forest itself lives in the COMPVSS roster engine.
 */

type Position = PositionRow & { created_at: string };

type AssignmentJoin = {
  id: string;
  position_id: string;
  parties: { display_name: string } | null;
};

export default async function OrganizationPillarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const chartView = view === "chart";
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.organization.title", undefined, "Organization")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: positionData }, { data: departmentData }, { data: assignmentData }] = await Promise.all([
    db
      .from("positions")
      .select("id, title, department_code, summary, active, created_at, reports_to_position_id, seat_count")
      .eq("org_id", session.orgId)
      .order("title", { ascending: true })
      .limit(500),
    db.from("dim_department").select("code, label").order("code", { ascending: true }).limit(20),
    chartView
      ? db
          .from("position_assignments")
          .select("id, position_id, parties(display_name)")
          .eq("org_id", session.orgId)
          .eq("assignment_state", "active")
          .limit(2000)
      : Promise.resolve({ data: null }),
  ]);

  const positions = (positionData ?? []) as Position[];
  const departments = (departmentData ?? []) as Department[];
  const labelByCode = new Map(departments.map((d) => [d.code, d.label]));

  const holdersByPosition = new Map<string, SeatHolder[]>();
  for (const a of (assignmentData ?? []) as AssignmentJoin[]) {
    const bucket = holdersByPosition.get(a.position_id) ?? [];
    bucket.push({
      assignmentId: a.id,
      name:
        a.parties?.display_name ??
        t("console.legend.hub.organization.holders.unknown", undefined, "Unknown person"),
    });
    holdersByPosition.set(a.position_id, bucket);
  }

  const groups: { key: string; heading: string; rows: Position[] }[] = [];
  for (const dept of departments) {
    const rows = positions.filter((p) => p.department_code === dept.code);
    if (rows.length > 0) groups.push({ key: dept.code, heading: `${dept.code} · ${dept.label}`, rows });
  }
  const unclassified = positions.filter((p) => !p.department_code || !labelByCode.has(p.department_code));
  if (unclassified.length > 0)
    groups.push({
      key: "unclassified",
      heading: t("console.legend.hub.organization.unclassified", undefined, "Unclassified"),
      rows: unclassified,
    });

  const activeCount = positions.filter((p) => p.active).length;
  const positionsLabel = (count: number) =>
    count === 1
      ? t("console.legend.hub.organization.onePosition", undefined, "1 position")
      : t("console.legend.hub.organization.nPositions", { count }, `${count} positions`);
  const totalLabel = positionsLabel(positions.length);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.organization.title", undefined, "Organization")}
        subtitle={
          positions.length === 0
            ? t(
                "console.legend.hub.organization.subtitleEmpty",
                undefined,
                "The position library, classed by XPMS department.",
              )
            : t(
                "console.legend.hub.organization.subtitleCounts",
                { active: activeCount, total: totalLabel },
                `${activeCount} active of ${totalLabel}`,
              )
        }
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.organization.title", undefined, "Organization") },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/hub/organization" size="sm" variant={chartView ? "secondary" : "primary"}>
              {t("console.legend.hub.organization.viewPositions", undefined, "Positions")}
            </Button>
            <Button
              href="/legend/hub/organization?view=chart"
              size="sm"
              variant={chartView ? "primary" : "secondary"}
            >
              {t("console.legend.hub.organization.viewChart", undefined, "Org chart")}
            </Button>
            <Button href={urlFor("mobile", "/roster/reporting")} size="sm" variant="secondary">
              {t("console.legend.hub.organization.reportingForest", undefined, "Reporting forest")}
            </Button>
            <Button href="/legend/hub/organization/new" size="sm">
              {t("console.legend.hub.organization.newPosition", undefined, "+ New Position")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-8">
        {chartView ? (
          <div className="max-w-3xl">
            <OrgChartView
              positions={positions as ChartPositionRow[]}
              holdersByPosition={holdersByPosition}
              labelByCode={labelByCode}
            />
          </div>
        ) : positions.length === 0 ? (
          <EmptyState
            title={t("console.legend.hub.organization.emptyTitle", undefined, "No positions yet")}
            description={t(
              "console.legend.hub.organization.emptyDescription",
              undefined,
              "Define the positions your organization hires and staffs against. New orgs start with one director per XPMS department class.",
            )}
            action={
              <Button href="/legend/hub/organization/new">
                {t("console.legend.hub.organization.newPosition", undefined, "+ New Position")}
              </Button>
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{group.heading}</h2>
                <Badge variant="muted">{positionsLabel(group.rows.length)}</Badge>
              </div>
              <DataView<Position>
                tableId={`t:/legend/hub/organization:${group.key}`}
                rows={group.rows}
                rowHref={(p) => `/legend/hub/organization/${p.id}`}
                emptyLabel={t(
                  "console.legend.hub.organization.emptyDepartment",
                  undefined,
                  "No positions in this department",
                )}
                columns={[
                  {
                    key: "title",
                    header: t("console.legend.hub.organization.columns.title", undefined, "Title"),
                    render: (p) => p.title,
                    accessor: (p) => p.title,
                  },
                  {
                    key: "summary",
                    header: t("console.legend.hub.organization.columns.summary", undefined, "Summary"),
                    render: (p) =>
                      p.summary ? (
                        <span className="line-clamp-1 text-[var(--p-text-2)]">{p.summary}</span>
                      ) : (
                        "—"
                      ),
                    accessor: (p) => p.summary ?? "",
                  },
                  {
                    key: "active",
                    header: t("console.legend.hub.organization.columns.status", undefined, "Status"),
                    render: (p) =>
                      p.active ? (
                        <Badge variant="success">{t("console.legend.hub.organization.active", undefined, "Active")}</Badge>
                      ) : (
                        <Badge variant="muted">{t("console.legend.hub.organization.archived", undefined, "Archived")}</Badge>
                      ),
                    accessor: (p) => (p.active ? "active" : "archived"),
                  },
                ]}
              />
            </section>
          ))
        )}
      </div>
    </>
  );
}
