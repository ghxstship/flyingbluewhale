import Link from "next/link";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { KIcon, LockedRow } from "@/components/mobile/kit";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { DirectoryView, type RosterPerson } from "./DirectoryView";

export const dynamic = "force-dynamic";

/**
 * /m/directory — the org team roster. Unions `crew_members` (the production
 * crew bench) and `workforce_members` (deskless staff) into one searchable,
 * groupable, swipe-to-act list. Neither table carries a typed team or status
 * column, so we derive: `team` from role bucket, status from availability /
 * verification, and `on` (online dot) from `availability_open`.
 *
 * Design truth: prototype roster tab (app.jsx 2333-2393).
 */

/**
 * Kit 32 E2 opt-in switch. The permission-denied default across /m stays
 * hide-when-denied; a surface flips this to trade invisibility for a
 * discoverable LockedRow ("Ask Your Lead"). Kept a const rather than a prop
 * because the decision is per-surface, not per-render.
 */
const SHOW_LOCKED_WHEN_DENIED = true;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const WORKFORCE_KIND_TEAM: Record<string, string> = {
  paid_staff: "Staff",
  volunteer: "Volunteers",
  contractor: "Contractors",
  intern: "Interns",
};

export default async function MobileDirectoryPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.directory.eyebrow", undefined, "Team")}</div>
        <h1 className="scr-h">{t("m.directory.title", undefined, "Team Roster")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // ONE query. This surface used to union `crew_members` (the crew bench) with
  // `workforce_members` (deskless staff) because they were two tables. They are
  // one table now (ADR-0015 Addendum 2) — keeping the union would list every
  // person twice, once under each old label.
  const { data: crew } = await supabase
    .from("crew_members")
    .select("id, name, role, phone, email, certifications, availability_open, verified_at, workforce_kind")
    .eq("org_id", session.orgId)
    .order("name", { ascending: true })
    .limit(400);

  type CrewRow = {
    id: string;
    name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
    certifications: string[];
    availability_open: boolean;
    verified_at: string | null;
    workforce_kind: string;
  };

  const crewLabel = t("m.directory.team.crew", undefined, "Crew");
  const availableLabel = t("m.directory.status.available", undefined, "Available");
  const verifiedLabel = t("m.directory.status.active", undefined, "Active");
  const offLabel = t("m.directory.status.off", undefined, "Off Site");

  const people: RosterPerson[] = ((crew ?? []) as CrewRow[])
    .map((c): RosterPerson => ({
      id: `crew:${c.id}`,
      name: c.name,
      // The person's own role wins; `workforce_kind` is the fallback label —
      // it is how a volunteer or contractor is told apart from paid staff now
      // that they share a table.
      role: c.role ?? WORKFORCE_KIND_TEAM[c.workforce_kind] ?? crewLabel,
      team: WORKFORCE_KIND_TEAM[c.workforce_kind] ?? crewLabel,
      av: initials(c.name),
      on: c.availability_open,
      status: c.availability_open ? availableLabel : c.verified_at ? verifiedLabel : offLabel,
      phone: c.phone ?? "",
      email: c.email ?? "",
      certs: c.certifications ?? [],
      source: "crew",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const labels = {
    search: t("m.directory.search", undefined, "Search crew, role, team…"),
    emptyTitle: t("m.directory.empty.title", undefined, "No Matches"),
    emptyBody: t("m.directory.empty.body", undefined, "Nobody on the roster matches."),
    message: t("m.directory.action.message", undefined, "Message"),
    call: t("m.directory.action.call", undefined, "Call"),
    email: t("m.directory.action.email", undefined, "Email"),
    actions: t("m.directory.action.menu", undefined, "Contact Actions"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.directory.eyebrow", { count: people.length }, `${people.length} On Roster`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.directory.title", undefined, "Team Roster")}
      </h1>
      <DirectoryView people={people} labels={labels} />
      {/* Kit FAB: Invite Crew — perm "assign" in the kit's CREATE map, which is
          the manager band here. The gate is UX only; the invite surface
          re-checks server-side. Kit 32 E2: instead of the capability vanishing
          for the member band, this surface OPTS IN to the LockedRow affordance
          (lock icon + "Ask Your Lead" sheet). The app-wide default stays
          hide-when-denied — SHOW_LOCKED_WHEN_DENIED is the per-surface switch. */}
      {isManagerPlus(session) ? (
        <Link href="/m/settings/team/invite" className="fab" aria-label={t("m.directory.invite", undefined, "Invite Crew")}>
          <KIcon name="Plus" size={24} />
        </Link>
      ) : (
        SHOW_LOCKED_WHEN_DENIED && (
          <>
            <div className="sech">
              <h2>{t("m.directory.manage", undefined, "Manage")}</h2>
            </div>
            <LockedRow
              icon="UserPlus"
              title={t("m.directory.invite", undefined, "Invite Crew")}
              sub={t("m.directory.invite.sub", undefined, "Add A Teammate To The Roster")}
              askTitle={t("m.locked.askTitle", undefined, "Ask Your Lead")}
              askBody={t(
                "m.directory.invite.locked",
                undefined,
                "Inviting crew is a manager action. Ask your lead or an admin to add someone to the roster.",
              )}
              closeLabel={t("m.locked.close", undefined, "Close")}
              lockLabel={t("m.locked.managerAccess", undefined, "Locked · Manager Access")}
            />
          </>
        )
      )}
    </div>
  );
}
