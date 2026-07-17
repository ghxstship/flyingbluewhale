import Link from "next/link";
import { UsersRound } from "lucide-react";
import { can, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listCrewMembers, listOfferLetters, listOrgRoles, listRateCardItems } from "@/lib/offer-letters/queries";
import { formatDollars } from "@/lib/offer-letters/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { RosterLock } from "../RosterLock";
import { resolveActiveProject } from "../shared";
import { AssignForm, type ManagerOpt, type PersonOpt, type RateOpt, type RoleOpt } from "./AssignForm";

export const dynamic = "force-dynamic";

/**
 * Kit 30 · /m/roster/assign — Assign To Project. Person picker (org crew
 * directory) → role (org_roles, with the role's crew-day-rate card prefilled
 * by SKU convention `CDR-<role slug>`) → contract dates defaulted to the
 * active project's window → reports-to (the project's live roster) →
 * "Send Offer Letter On Save".
 */
export default async function AssignPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const eyebrow = t("m.roster.assign.eyebrow", undefined, "Assign To Project");
  const title = t("m.roster.assign.title", undefined, "Assign Person");

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={eyebrow}
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
        <div className="scr-eye">{eyebrow}</div>
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

  const [crew, roles, rates, letters] = await Promise.all([
    listCrewMembers(session.orgId),
    listOrgRoles(session.orgId),
    listRateCardItems(session.orgId),
    listOfferLetters(session.orgId, project.id),
  ]);

  const people: PersonOpt[] = crew.map((c) => ({ id: c.id, name: c.name, role: c.role }));
  const rateBySku = new Map(rates.map((r) => [r.sku, r.id]));
  const roleOpts: RoleOpt[] = roles.map((r) => ({
    id: r.id,
    label: r.label,
    department: r.department,
    // SKU convention from the rate-card seed: `CDR-<role slug>`.
    rateCardItemId: rateBySku.get(`CDR-${r.slug}`) ?? null,
  }));
  const rateOpts: RateOpt[] = rates.map((r) => ({
    id: r.id,
    label: `${r.name} · ${formatDollars(r.unit_price_cents)}`,
  }));
  const managers: ManagerOpt[] = letters
    .filter((l) => l.status !== "withdrawn" && l.status !== "declined")
    .map((l) => ({ id: l.crew_member_id, label: `${l.recipient_name} · ${l.role_title}` }));

  if (people.length === 0) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{eyebrow}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {title}
        </h1>
        <EmptyState
          icon={<UsersRound size={28} aria-hidden="true" />}
          title={t("m.roster.assign.noPeople.title", undefined, "Pick Someone To Assign")}
          description={t(
            "m.roster.assign.noPeople.body",
            undefined,
            "The org directory is empty. Add people from the console and they appear here.",
          )}
          action={
            <Link href="/m/directory" className="ps-btn ps-btn--secondary">
              {t("m.roster.assign.noPeople.cta", undefined, "Open Directory")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.roster.assign.eyebrowProject", { project: project.name }, `Assign To Project · ${project.name}`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>
      <AssignForm
        projectId={project.id}
        projectName={project.name}
        defaultStart={project.start_date}
        defaultEnd={project.end_date}
        people={people}
        roles={roleOpts}
        rates={rateOpts}
        managers={managers}
      />
    </div>
  );
}
