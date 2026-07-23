import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { assignHolderAction, endAssignmentAction, setPositionActiveAction, updatePositionAction } from "../actions";
import { PositionForm, type Department, type PositionRow, type ReportsToOption } from "../PositionForm";
import { AssignHolderForm } from "../AssignHolderForm";
import { selfAndDescendants } from "../org-chart";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type OrgPosition = { id: string; title: string; reports_to_position_id: string | null };

type AssignmentRow = {
  id: string;
  party_id: string;
  starts_on: string | null;
  ends_on: string | null;
  assignment_state: "active" | "ended";
  parties: { display_name: string } | null;
};

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const { positionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.organization.detail.title", undefined, "Position")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: position }, { data: departmentData }, { data: orgPositionData }, { data: assignmentData }] =
    await Promise.all([
      db
        .from("positions")
        .select("id, title, department_code, summary, active, reports_to_position_id, seat_count")
        .eq("org_id", session.orgId)
        .eq("id", positionId)
        .maybeSingle(),
      db.from("dim_department").select("code, label").order("code", { ascending: true }).limit(20),
      db
        .from("positions")
        .select("id, title, reports_to_position_id")
        .eq("org_id", session.orgId)
        .order("title", { ascending: true })
        .limit(2000),
      db
        .from("position_assignments")
        .select("id, party_id, starts_on, ends_on, assignment_state, parties(display_name)")
        .eq("org_id", session.orgId)
        .eq("position_id", positionId)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);
  if (!position) notFound();
  const row = position as PositionRow;
  const departments = (departmentData ?? []) as Department[];
  const deptLabel = departments.find((d) => d.code === row.department_code)?.label;

  // Reports-to candidates: every org position EXCEPT this one and its
  // descendants — parenting into your own subtree is a cycle.
  const orgPositions = (orgPositionData ?? []) as OrgPosition[];
  const excluded = selfAndDescendants(orgPositions, row.id);
  const reportsToOptions: ReportsToOption[] = orgPositions
    .filter((p) => !excluded.has(p.id))
    .map((p) => ({ id: p.id, title: p.title }));

  const assignments = (assignmentData ?? []) as AssignmentRow[];
  const activeHolders = assignments.filter((a) => a.assignment_state === "active");
  const pastHolders = assignments.filter((a) => a.assignment_state === "ended");
  const openSeats = Math.max(0, row.seat_count - activeHolders.length);

  const holderName = (a: AssignmentRow) =>
    a.parties?.display_name ?? t("console.legend.hub.organization.holders.unknown", undefined, "Unknown person");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
        title={row.title}
        subtitle={
          row.department_code
            ? `${row.department_code} · ${deptLabel ?? t("console.legend.hub.organization.detail.department", undefined, "Department")}`
            : t("console.legend.hub.organization.detail.unclassified", undefined, "Unclassified position")
        }
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.organization.title", undefined, "Organization"), href: "/legend/hub/organization" },
          { label: row.title },
        ]}
        action={
          <div className="flex items-center gap-3">
            {row.active ? (
              <Badge variant="success">{t("console.legend.hub.organization.active", undefined, "Active")}</Badge>
            ) : (
              <Badge variant="muted">{t("console.legend.hub.organization.archived", undefined, "Archived")}</Badge>
            )}
            <form action={setPositionActiveAction.bind(null, row.id, !row.active)}>
              <Button type="submit" size="sm" variant="secondary">
                {row.active
                  ? t("console.legend.hub.organization.detail.archive", undefined, "Archive")
                  : t("console.legend.hub.organization.detail.restore", undefined, "Restore")}
              </Button>
            </form>
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-10">
        <PositionForm
          action={updatePositionAction.bind(null, row.id)}
          departments={departments}
          reportsToOptions={reportsToOptions}
          position={row}
          submitLabel={t("console.legend.hub.organization.detail.submit", undefined, "Save Position")}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
              {t("console.legend.hub.organization.holders.title", undefined, "Seat holders")}
            </h2>
            {openSeats > 0 ? (
              <Badge variant="warning">
                {openSeats === 1
                  ? t("console.legend.hub.organization.holders.oneOpenSeat", undefined, "1 open seat")
                  : t(
                      "console.legend.hub.organization.holders.nOpenSeats",
                      { count: openSeats },
                      `${openSeats} open seats`,
                    )}
              </Badge>
            ) : (
              <Badge variant="muted">
                {t("console.legend.hub.organization.holders.fullyStaffed", undefined, "Fully staffed")}
              </Badge>
            )}
          </div>

          {activeHolders.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.hub.organization.holders.emptyActive",
                undefined,
                "Nobody holds this position yet. Assign the first person below.",
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {activeHolders.map((a) => (
                <li key={a.id} className="surface flex items-center gap-3 p-3">
                  <Avatar name={holderName(a)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{holderName(a)}</div>
                    {a.starts_on && (
                      <div className="text-xs text-[var(--p-text-3)]">
                        {t(
                          "console.legend.hub.organization.holders.since",
                          { date: a.starts_on },
                          `Since ${a.starts_on}`,
                        )}
                      </div>
                    )}
                  </div>
                  <form action={endAssignmentAction.bind(null, a.id, row.id)}>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("console.legend.hub.organization.holders.end", undefined, "End")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <AssignHolderForm action={assignHolderAction.bind(null, row.id)} positionId={row.id} />

          {pastHolders.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-xs font-medium text-[var(--p-text-2)]">
                {pastHolders.length === 1
                  ? t("console.legend.hub.organization.holders.onePast", undefined, "1 past holder")
                  : t(
                      "console.legend.hub.organization.holders.nPast",
                      { count: pastHolders.length },
                      `${pastHolders.length} past holders`,
                    )}
              </summary>
              <ul className="mt-2 space-y-1">
                {pastHolders.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
                    <span className="font-medium">{holderName(a)}</span>
                    <span className="text-[var(--p-text-3)]">
                      {a.starts_on ?? "…"} → {a.ends_on ?? "…"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      </div>
    </>
  );
}
