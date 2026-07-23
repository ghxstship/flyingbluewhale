import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataView } from "@/components/views/DataViewServer";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import {
  CATALOG_KIND_LABEL_SINGULAR,
  countProjectAssignments,
  listProjectAssignments,
  type AssignmentListRow,
} from "@/lib/db/assignments";
import { bulkAdvanceAssignments } from "./actions";
import { AssignmentsKanban } from "./AssignmentsKanban";

export const dynamic = "force-dynamic";

/**
 * /studio/projects/[projectId]/advancing/assignments — per-individual
 * catalog assignment admin. Operators assign tickets, credentials,
 * catering, radios, tools, equipment, uniforms, travel, lodging, and
 * vehicles to specific people on the project. One table (`assignments`),
 * one lifecycle (`fulfillment_state`), one set of UI controls — the same
 * row shows up on the assignee's portal (/p/[slug]/crew/advances) and
 * field (/m/advances) surfaces.
 *
 * PF-6 + FE-2: renders through the canonical DataView (client search / sort /
 * virtualization), kind surfaces as a filterable + groupable column
 * instead of N stacked per-kind tables, the 500-row read cap is surfaced
 * honestly via `totalCount`, and bulk fulfillment transitions ride the
 * built-in selection system (server re-validates every row against
 * NEXT_FULFILLMENT_STATES and reports partial failures).
 */

type Row = AssignmentListRow & { party: string; kindLabel: string };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.projects.advancing.assignments.eyebrow", undefined, "Advancing")}
          title={t("console.projects.advancing.assignments.title", undefined, "Individual Assignments")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.projects.advancing.assignments.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const { projectId } = await params;
  const sp = await searchParams;
  const view = sp?.view === "board" ? "board" : "list";
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const [rows, totalCount] = await Promise.all([
    listProjectAssignments(session.orgId, projectId),
    countProjectAssignments(session.orgId, projectId),
  ]);

  // Hydrate party names across all three kinds in parallel.
  const userIds = Array.from(new Set(rows.filter((r) => r.party_user_id).map((r) => r.party_user_id!)));
  const crewIds = Array.from(new Set(rows.filter((r) => r.party_crew_id).map((r) => r.party_crew_id!)));
  const extIds = Array.from(new Set(rows.filter((r) => r.party_external_id).map((r) => r.party_external_id!)));
  const [userRes, crewRes, extRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
    crewIds.length ? supabase.from("crew_members").select("id, name").in("id", crewIds) : Promise.resolve({ data: [] }),
    extIds.length
      ? supabase.from("assignment_external_holders").select("id, holder_name, holder_email").in("id", extIds)
      : Promise.resolve({ data: [] }),
  ]);
  const userMap = new Map<string, string>(
    ((userRes.data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );
  const crewMap = new Map<string, string>(
    ((crewRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
  );
  const extMap = new Map<string, string>(
    ((extRes.data ?? []) as Array<{ id: string; holder_name: string | null; holder_email: string | null }>).map((e) => [
      e.id,
      e.holder_name ?? e.holder_email ?? t("console.projects.advancing.assignments.guest", undefined, "Guest"),
    ]),
  );

  function partyLabel(r: AssignmentListRow): string {
    if (r.party_kind === "user" && r.party_user_id)
      return (
        userMap.get(r.party_user_id) ??
        t("console.projects.advancing.assignments.unknownUser", undefined, "Unknown user")
      );
    if (r.party_kind === "crew_member" && r.party_crew_id)
      return (
        crewMap.get(r.party_crew_id) ??
        t("console.projects.advancing.assignments.unknownCrew", undefined, "Unknown crew")
      );
    if (r.party_kind === "external_holder" && r.party_external_id)
      return extMap.get(r.party_external_id) ?? t("console.projects.advancing.assignments.guest", undefined, "Guest");
    return t("console.projects.advancing.assignments.unassigned", undefined, "Unassigned");
  }

  const tableRows: Row[] = rows.map((r) => ({
    ...r,
    party: partyLabel(r),
    kindLabel: CATALOG_KIND_LABEL_SINGULAR[r.catalog_kind] ?? r.catalog_kind,
  }));

  // Bulk transitions — the common operator verbs. The server skips and
  // reports any selected row whose current state can't legally reach the
  // target, so a mixed selection degrades to a partial-failure toast
  // instead of an illegal jump.
  const bulkApprove = bulkAdvanceAssignments.bind(null, projectId, "approved");
  const bulkIssue = bulkAdvanceAssignments.bind(null, projectId, "issued");
  const bulkVoid = bulkAdvanceAssignments.bind(null, projectId, "voided");

  return (
    <>
      <ModuleHeader
        eyebrow={project.name as string}
        title={t("console.projects.advancing.assignments.title", undefined, "Individual Assignments")}
        subtitle={`${totalCount} ${totalCount === 1 ? t("console.projects.advancing.assignments.assignmentSingular", undefined, "Assignment") : t("console.projects.advancing.assignments.assignmentPlural", undefined, "Assignments")} · ${t("console.projects.advancing.assignments.subtitleKinds", undefined, "Tickets, Credentials, Catering, Radios, Tools, Equipment, Uniforms, Travel, Lodging, Vehicles")}`}
        action={
          <Button href={`/studio/projects/${projectId}/advancing/assignments/new`} size="sm">
            {t("console.projects.advancing.assignments.newAssignment", undefined, "+ New Assignment")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {/* Sub-tabs inside the content band — mirrors the doc-specs page so
            the Doc Specs ⇄ Assignments split is one click in both
            directions. */}
        <RouteTabs
          tabs={[
            {
              label: t("console.projects.advancing.tabs.docSpecs", undefined, "Doc Specs"),
              href: `/studio/projects/${projectId}/advancing`,
            },
            {
              label: t("console.projects.advancing.tabs.assignments", undefined, "Assignments"),
              href: `/studio/projects/${projectId}/advancing/assignments`,
            },
            {
              label: t("console.projects.advancing.tabs.packet", undefined, "Packet"),
              href: `/studio/projects/${projectId}/advancing/packet`,
            },
          ]}
          className="border-b border-[var(--p-border)]"
        />
        {/* List ⇄ Board view toggle. Board groups by fulfillment_state and
            drag-transitions through the same NEXT_FULFILLMENT_STATES guard. */}
        <div className="flex justify-end">
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--p-border)] text-xs font-medium">
            <Link
              href={`/studio/projects/${projectId}/advancing/assignments`}
              aria-current={view === "list" ? "page" : undefined}
              className={
                view === "list"
                  ? "bg-[var(--p-accent)] px-3 py-1.5 text-white"
                  : "px-3 py-1.5 text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
              }
            >
              {t("console.projects.advancing.assignments.view.list", undefined, "List")}
            </Link>
            <Link
              href={`/studio/projects/${projectId}/advancing/assignments?view=board`}
              aria-current={view === "board" ? "page" : undefined}
              className={
                view === "board"
                  ? "bg-[var(--p-accent)] px-3 py-1.5 text-white"
                  : "px-3 py-1.5 text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
              }
            >
              {t("console.projects.advancing.assignments.view.board", undefined, "Board")}
            </Link>
          </div>
        </div>
        {view === "board" ? (
          <AssignmentsKanban
            projectId={projectId}
            rows={tableRows.map((r) => ({
              id: r.id,
              fulfillment_state: r.fulfillment_state,
              party_kind: r.party_kind,
              party: r.party,
              kindLabel: r.kindLabel,
              title: r.title,
              deadline: r.deadline,
            }))}
          />
        ) : (
          <DataView<Row>
          tableId="projects.advancing.assignments"
          rows={tableRows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/projects/${projectId}/advancing/assignments/${r.id}`}
          emptyLabel={t("console.projects.advancing.assignments.emptyTitle", undefined, "No Assignments Yet")}
          emptyDescription={t(
            "console.projects.advancing.assignments.emptyDescription",
            undefined,
            "Whatever you assign here lands on the assignee's portal and mobile views in real time.",
          )}
          emptyAction={
            <Button href={`/studio/projects/${projectId}/advancing/assignments/new`} size="sm">
              {t("console.projects.advancing.assignments.newAssignment", undefined, "+ New Assignment")}
            </Button>
          }
          bulkActions={[
            {
              id: "approve",
              label: t("console.projects.advancing.assignments.bulk.approve", undefined, "Approve"),
              perform: bulkApprove,
            },
            {
              id: "issue",
              label: t("console.projects.advancing.assignments.bulk.issue", undefined, "Issue"),
              perform: bulkIssue,
            },
            {
              id: "void",
              label: t("console.projects.advancing.assignments.bulk.void", undefined, "Void"),
              variant: "danger",
              perform: bulkVoid,
            },
          ]}
          columns={[
            {
              key: "party",
              header: t("console.projects.advancing.assignments.columns.party", undefined, "Party"),
              render: (r) =>
                r.party_kind === "external_holder" ? <Badge variant="warning">{r.party}</Badge> : r.party,
              accessor: (r) => r.party,
              filterable: true,
            },
            {
              key: "title",
              header: t("console.projects.advancing.assignments.columns.title", undefined, "Catalog Item"),
              render: (r) => r.title ?? t("console.projects.advancing.assignments.untitled", undefined, "Untitled"),
              accessor: (r) => r.title ?? null,
            },
            {
              key: "kind",
              header: t("console.projects.advancing.assignments.columns.kind", undefined, "Kind"),
              render: (r) => r.kindLabel,
              accessor: (r) => r.kindLabel,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("console.projects.advancing.assignments.columns.state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.fulfillment_state} />,
              accessor: (r) => r.fulfillment_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "deadline",
              header: t("console.projects.advancing.assignments.columns.due", undefined, "Due"),
              render: (r) => (r.deadline ? fmt.date(r.deadline) : "—"),
              accessor: (r) => r.deadline ?? null,
              mono: true,
            },
            {
              key: "updated",
              header: t("console.projects.advancing.assignments.columns.updated", undefined, "Updated"),
              render: (r) => fmt.date(r.updated_at),
              accessor: (r) => r.updated_at,
              mono: true,
            },
          ]}
          />
        )}
      </div>
    </>
  );
}
