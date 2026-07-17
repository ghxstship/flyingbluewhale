export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersRound } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { can, requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { listOfferLetters } from "@/lib/offer-letters/queries";
import { createClient } from "@/lib/supabase/server";
import { CapabilityLock } from "../CapabilityLock";
import { LIVE_LETTER_STATES, displayRoleTitle } from "../letter-state";
import { EditReportsDrawer, type RosterPerson } from "./EditReportsDrawer";

type Node = {
  crewId: string;
  name: string;
  role: string;
  reportsTo: string | null;
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { projectId } = await params;
  const { edit } = await searchParams;
  const session = await requireSession();
  const { t } = await getRequestT();
  const base = `/studio/projects/${projectId}/roster`;

  if (!can(session, "people:manage")) {
    return <CapabilityLock capability="people:manage" backHref={`/studio/projects/${projectId}`} />;
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  // One node per person: the latest live letter carries the reporting edge.
  const letters = (await listOfferLetters(session.orgId, projectId)).filter((l) =>
    (LIVE_LETTER_STATES as readonly string[]).includes(l.status),
  );
  const byCrew = new Map<string, Node>();
  for (const l of letters) {
    const existing = byCrew.get(l.crew_member_id);
    if (existing) continue; // listOfferLetters is name-ordered; first live letter wins
    byCrew.set(l.crew_member_id, {
      crewId: l.crew_member_id,
      name: l.recipient_name,
      role: displayRoleTitle(l.role_slug, l.role_title, l.expectations_override),
      reportsTo: l.reports_to_crew_member_id,
    });
  }
  const nodes = [...byCrew.values()];

  const childrenOf = new Map<string, Node[]>();
  for (const n of nodes) {
    if (n.reportsTo && byCrew.has(n.reportsTo)) {
      const bucket = childrenOf.get(n.reportsTo) ?? [];
      bucket.push(n);
      childrenOf.set(n.reportsTo, bucket);
    }
  }
  // Top level = anyone whose manager is unset or off-roster. Managers with
  // reports render as trees; the rest sit flat under "No Manager".
  const topLevel = nodes.filter((n) => !n.reportsTo || !byCrew.has(n.reportsTo));
  const treeRoots = topLevel.filter((n) => (childrenOf.get(n.crewId) ?? []).length > 0);
  const unassigned = topLevel.filter((n) => (childrenOf.get(n.crewId) ?? []).length === 0);
  const edgeCount = nodes.filter((n) => n.reportsTo && byCrew.has(n.reportsTo)).length;

  function renderNode(n: Node, depth: number, visited: Set<string>): ReactNode {
    if (visited.has(n.crewId) || depth > 12) return null; // pre-existing bad data can't hang the render
    visited.add(n.crewId);
    const reports = childrenOf.get(n.crewId) ?? [];
    return (
      <div key={n.crewId} className={depth > 0 ? "ml-5 border-l-2 border-[var(--p-border)] pl-3" : undefined}>
        <div className="surface mb-2 flex items-center gap-3 p-3">
          <Avatar name={n.name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{n.name}</div>
            <div className="truncate text-xs text-[var(--p-text-2)]">{n.role}</div>
          </div>
          {reports.length > 0 && (
            <Badge variant="muted">
              {reports.length === 1
                ? t("console.projects.roster.reporting.reportCountOne", { count: reports.length }, "1 Direct Report")
                : t(
                    "console.projects.roster.reporting.reportCountOther",
                    { count: reports.length },
                    `${reports.length} Direct Reports`,
                  )}
            </Badge>
          )}
        </div>
        {reports.map((r) => renderNode(r, depth + 1, visited))}
      </div>
    );
  }

  const editCta = (
    <Button href={`${base}/reporting?edit=1`} variant="cta">
      <UsersRound size={15} />
      {t("console.projects.roster.reporting.editCta", undefined, "Edit Reports")}
    </Button>
  );

  const people: RosterPerson[] = nodes.map((n) => ({ id: n.crewId, name: n.name, role: n.role }));
  const visited = new Set<string>();

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.roster.reporting.title", undefined, "Reporting Structure")}
        subtitle={t(
          "console.projects.roster.reporting.subtitle",
          undefined,
          "Who Reports To Whom On This Project",
        )}
        action={nodes.length > 0 ? editCta : undefined}
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/studio/projects" },
          { label: project.name, href: `/studio/projects/${projectId}` },
          { label: t("console.projects.roster.title", undefined, "Project Roster"), href: base },
          { label: t("console.projects.roster.reporting.title", undefined, "Reporting Structure") },
        ]}
      />
      <div className="page-content max-w-3xl space-y-6">
        {nodes.length === 0 ? (
          <EmptyState
            title={t("console.projects.roster.reporting.emptyTitle", undefined, "No Reporting Lines Yet")}
            description={t(
              "console.projects.roster.reporting.emptyDescription",
              undefined,
              "Assign people to the roster first, then pick a manager and add their direct reports.",
            )}
            action={
              <Button href={base} variant="secondary">
                {t("console.projects.roster.reporting.backToRoster", undefined, "Open The Roster")}
              </Button>
            }
          />
        ) : edgeCount === 0 ? (
          <EmptyState
            title={t("console.projects.roster.reporting.noEdgesTitle", undefined, "No Reporting Lines Yet")}
            description={t(
              "console.projects.roster.reporting.noEdgesDescription",
              undefined,
              "Pick a manager on this project and add their direct reports.",
            )}
            action={editCta}
          />
        ) : (
          <>
            <div>{treeRoots.map((n) => renderNode(n, 0, visited))}</div>
            {unassigned.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
                  {t("console.projects.roster.reporting.noManager", undefined, "No Manager")}
                </h2>
                {unassigned.map((n) => renderNode(n, 0, visited))}
              </section>
            )}
            <p className="text-xs text-[var(--p-text-3)]">
              {t(
                "console.projects.roster.reporting.footnote",
                undefined,
                "One edge per engagement. Approvals, escalations, and timesheet routing follow this line.",
              )}{" "}
              <Link href={base} className="font-semibold text-[var(--p-accent-text)] hover:underline">
                {t("console.projects.roster.reporting.backToRoster", undefined, "Open The Roster")}
              </Link>
            </p>
          </>
        )}
      </div>
      {edit === "1" && nodes.length > 0 && (
        <EditReportsDrawer projectId={projectId} closeHref={`${base}/reporting`} people={people} />
      )}
    </>
  );
}
