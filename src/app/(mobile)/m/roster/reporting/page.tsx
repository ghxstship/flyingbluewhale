import Link from "next/link";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { buildReportingBranches, type ReportingBranch } from "@/lib/db/reporting";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { RosterLock } from "../RosterLock";
import { LIVE_LETTER_STATES, initialsFor, resolveActiveProject } from "../shared";
import { EditReportsForm, type ReportPersonOpt } from "./EditReportsForm";

export const dynamic = "force-dynamic";

/**
 * Kit 30 · /m/roster/reporting — the active project's reporting structure as
 * an indented branch list (left-rule indent per level, node = person + role +
 * direct-report count) off `offer_letters.reports_to_crew_member_id`, plus a
 * per-person Edit Reports select. One edge per engagement — approvals,
 * escalations, and timesheet routing follow it.
 */

type Node = {
  id: string; // crew_member_id — the tree key
  reportsTo: string | null;
  letterId: string;
  name: string;
  role: string;
};

function Branch({ branch, depth, reportsLabel }: { branch: ReportingBranch<Node>; depth: number; reportsLabel: string }) {
  const inner = (
    <>
      <Link href={`/m/roster/${branch.node.letterId}/contract`} className="item tap" style={{ cursor: "pointer" }}>
        <span className="avatar-sm">{initialsFor(branch.node.name)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{branch.node.name}</div>
          <div className="s">{branch.node.role}</div>
        </div>
        {branch.reportCount > 0 && (
          <span className="ps-badge ps-badge--neutral" style={{ flex: "none" }}>
            {branch.reportCount} {reportsLabel}
          </span>
        )}
      </Link>
      {branch.children.map((c) => (
        <Branch key={c.node.id} branch={c} depth={depth + 1} reportsLabel={reportsLabel} />
      ))}
    </>
  );
  if (depth === 0) return inner;
  return (
    <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: "2px solid var(--p-border)" }}>{inner}</div>
  );
}

export default async function ReportingPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const title = t("m.roster.reporting.title", undefined, "Reporting Structure");

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={t("m.roster.reporting.eyebrow", undefined, "People")}
        title={title}
        body={t("m.roster.lock.body", undefined, "Managing the project roster requires the capability")}
        capability="people:manage"
        backHref="/m/roster"
        backLabel={t("m.roster.assign.back", undefined, "Back To Roster")}
      />
    );
  }

  const project = await resolveActiveProject(session.orgId);
  if (!project) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.roster.reporting.eyebrow", undefined, "People")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {title}
        </h1>
        <EmptyState
          title={t("m.roster.noProject.title", undefined, "No Live Project")}
          description={t(
            "m.roster.noProject.body",
            undefined,
            "The roster follows the active project. Activate one from the console and it appears here.",
          )}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("offer_letters_resolved")
    .select("id, crew_member_id, reports_to_crew_member_id, recipient_name, role_title")
    .eq("org_id", session.orgId)
    .eq("project_id", project.id)
    .in("status", [...LIVE_LETTER_STATES])
    .order("recipient_name", { ascending: true });

  const letters = (data ?? []) as unknown as Array<{
    id: string;
    crew_member_id: string;
    reports_to_crew_member_id: string | null;
    recipient_name: string;
    role_title: string;
  }>;

  // One node per person: a crew member holds at most one live letter per
  // project (unique org × project × crew), so crew_member_id is the tree key.
  const nodes: Node[] = letters.map((l) => ({
    id: l.crew_member_id,
    reportsTo: l.reports_to_crew_member_id,
    letterId: l.id,
    name: l.recipient_name,
    role: l.role_title,
  }));

  const forest = buildReportingBranches(nodes);
  const people: ReportPersonOpt[] = nodes.map((n) => ({ crewId: n.id, label: `${n.name} · ${n.role}` }));
  const reportsToByCrewId = Object.fromEntries(nodes.map((n) => [n.id, n.reportsTo ?? ""]));

  return (
    <div className="screen screen-anim">
      <Link href="/m/roster" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.roster.title", undefined, "Project Roster")}
      </Link>
      <div className="scr-eye">
        {t("m.roster.reporting.eyebrowFor", { project: project.name }, `${project.name} · People`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <div className="ps-alert" role="note" style={{ marginBottom: 12 }}>
        {t(
          "m.roster.reporting.note",
          undefined,
          "One edge per engagement. Approvals, escalations, and timesheet routing follow this line.",
        )}
      </div>

      {nodes.length === 0 ? (
        <EmptyState
          title={t("m.roster.reporting.empty.title", undefined, "No Reporting Lines Yet")}
          description={t(
            "m.roster.reporting.empty.body",
            undefined,
            "Pick a manager on this project and add their direct reports.",
          )}
          action={
            <Link href="/m/roster/assign" className="ps-btn ps-btn--cta">
              {t("m.roster.reporting.empty.cta", undefined, "Assign Person")}
            </Link>
          }
        />
      ) : (
        <>
          {forest.map((b) => (
            <Branch
              key={b.node.id}
              branch={b}
              depth={0}
              reportsLabel={t("m.roster.reporting.reports", undefined, "Reports")}
            />
          ))}
          <EditReportsForm projectId={project.id} people={people} reportsToByCrewId={reportsToByCrewId} />
        </>
      )}
    </div>
  );
}
