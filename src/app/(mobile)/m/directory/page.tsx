import { requireSession } from "@/lib/auth";
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

  const [{ data: crew }, { data: workforce }] = await Promise.all([
    supabase
      .from("crew_members")
      .select("id, name, role, phone, email, certifications, availability_open, verified_at")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("workforce_members")
      .select("id, full_name, role, phone, email, kind")
      .eq("org_id", session.orgId)
      .order("full_name", { ascending: true })
      .limit(200),
  ]);

  type CrewRow = {
    id: string;
    name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
    certifications: string[];
    availability_open: boolean;
    verified_at: string | null;
  };
  type WorkforceRow = {
    id: string;
    full_name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
    kind: string;
  };

  const crewLabel = t("m.directory.team.crew", undefined, "Crew");
  const availableLabel = t("m.directory.status.available", undefined, "Available");
  const verifiedLabel = t("m.directory.status.active", undefined, "Active");
  const offLabel = t("m.directory.status.off", undefined, "Off Site");

  const people: RosterPerson[] = [
    ...((crew ?? []) as CrewRow[]).map((c): RosterPerson => ({
      id: `crew:${c.id}`,
      name: c.name,
      role: c.role ?? crewLabel,
      team: crewLabel,
      av: initials(c.name),
      on: c.availability_open,
      status: c.availability_open ? availableLabel : c.verified_at ? verifiedLabel : offLabel,
      phone: c.phone ?? "",
      email: c.email ?? "",
      certs: c.certifications ?? [],
      source: "crew",
    })),
    ...((workforce ?? []) as WorkforceRow[]).map((w): RosterPerson => ({
      id: `wf:${w.id}`,
      name: w.full_name,
      role: w.role ?? (WORKFORCE_KIND_TEAM[w.kind] ?? "Staff"),
      team: WORKFORCE_KIND_TEAM[w.kind] ?? "Staff",
      av: initials(w.full_name),
      on: false,
      status: verifiedLabel,
      phone: w.phone ?? "",
      email: w.email ?? "",
      certs: [],
      source: "workforce",
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const labels = {
    search: t("m.directory.search", undefined, "Search crew, role, team…"),
    emptyTitle: t("m.directory.empty.title", undefined, "No Matches"),
    emptyBody: t("m.directory.empty.body", undefined, "Nobody on the roster matches."),
    message: t("m.directory.action.message", undefined, "Message"),
    call: t("m.directory.action.call", undefined, "Call"),
    email: t("m.directory.action.email", undefined, "Email"),
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
    </div>
  );
}
