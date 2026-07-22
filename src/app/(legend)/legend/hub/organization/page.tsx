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

export const dynamic = "force-dynamic";

/**
 * Organization pillar: the position library, hub-native (full CRUD here).
 * Positions are classed by XPMS department (dim_department); the reporting
 * forest itself lives in the COMPVSS roster engine.
 */

type Position = PositionRow & { created_at: string };

export default async function OrganizationPillarPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Organization" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: positionData }, { data: departmentData }] = await Promise.all([
    db
      .from("positions")
      .select("id, title, department_code, summary, active, created_at")
      .eq("org_id", session.orgId)
      .order("title", { ascending: true })
      .limit(500),
    db.from("dim_department").select("code, label").order("code", { ascending: true }).limit(20),
  ]);

  const positions = (positionData ?? []) as Position[];
  const departments = (departmentData ?? []) as Department[];
  const labelByCode = new Map(departments.map((d) => [d.code, d.label]));

  const groups: { key: string; heading: string; rows: Position[] }[] = [];
  for (const dept of departments) {
    const rows = positions.filter((p) => p.department_code === dept.code);
    if (rows.length > 0) groups.push({ key: dept.code, heading: `${dept.code} · ${dept.label}`, rows });
  }
  const unclassified = positions.filter((p) => !p.department_code || !labelByCode.has(p.department_code));
  if (unclassified.length > 0) groups.push({ key: "unclassified", heading: "Unclassified", rows: unclassified });

  const activeCount = positions.filter((p) => p.active).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="Organization"
        subtitle={
          positions.length === 0
            ? "The position library, classed by XPMS department."
            : `${activeCount} active of ${positions.length === 1 ? "1 position" : `${positions.length} positions`}`
        }
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Organization" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={urlFor("mobile", "/roster/reporting")} size="sm" variant="secondary">
              Reporting forest
            </Button>
            <Button href="/legend/hub/organization/new" size="sm">
              + New Position
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-8">
        {positions.length === 0 ? (
          <EmptyState
            title="No positions yet"
            description="Define the positions your organization hires and staffs against. New orgs start with one director per XPMS department class."
            action={<Button href="/legend/hub/organization/new">+ New Position</Button>}
          />
        ) : (
          groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{group.heading}</h2>
                <Badge variant="muted">
                  {group.rows.length === 1 ? "1 position" : `${group.rows.length} positions`}
                </Badge>
              </div>
              <DataView<Position>
                tableId={`t:/legend/hub/organization:${group.key}`}
                rows={group.rows}
                rowHref={(p) => `/legend/hub/organization/${p.id}`}
                emptyLabel="No positions in this department"
                columns={[
                  {
                    key: "title",
                    header: "Title",
                    render: (p) => p.title,
                    accessor: (p) => p.title,
                  },
                  {
                    key: "summary",
                    header: "Summary",
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
                    header: "State",
                    render: (p) =>
                      p.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Archived</Badge>,
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
