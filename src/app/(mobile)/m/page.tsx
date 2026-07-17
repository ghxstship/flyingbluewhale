import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { HomeShell, type HomeData, type HomeLabels } from "./HomeShell";
import { resolveEmergencyStation } from "@/lib/mobile/emergency-station";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m` home — the field dashboard. Server component: fetches the real
 * counts (open tasks assigned to me, my assignments, recent chat messages) and
 * the next upcoming event, then hands plain data + translated labels to the
 * `<HomeShell>` client island. Design ref: app.jsx 1663-1711.
 */
export default async function MobileHome() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const nowIso = new Date().toISOString();

  // The four dashboard reads are independent of each other — run them in
  // one parallel round (HP-12); this is the field PWA home, often on a bad
  // network, so serial waterfalls hurt the most here.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: openTasks }, { count: myAdvances }, { count: unread }, { data: ev }, { data: me }, station] =
    await Promise.all([
    // Open tasks assigned to me (anything not yet done).
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("assigned_to", session.userId)
      .neq("task_state", "done"),
    // My assignments (advancing — tickets/credentials/etc.).
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("party_user_id", session.userId)
      .is("deleted_at", null),
    // Recent chat messages (last 7 days) as the "unread" proxy — no per-user
    // read cursor join here; the inbox surface owns precise unread accounting.
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", sevenDaysAgo),
    // Next upcoming event.
    supabase
      .from("events")
      .select("id, name, starts_at, event_state")
      .eq("org_id", session.orgId)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("users").select("name").eq("id", session.userId).is("deleted_at", null).maybeSingle(),
    // The viewer's emergency station — the kit's home Emergency Card. Shared
    // resolver with /m/emergency so the two can't drift.
    resolveEmergencyStation(session.orgId, session.userId, {
      unassigned: t("m.emergency.unassigned", undefined, "Awaiting Assignment"),
      musterTo: (to: string) => t("m.emergency.musterTo", { to }, `Muster: ${to}`),
    }),
  ]);

  const nextShift: HomeData["nextShift"] = ev
    ? {
        id: ev.id,
        name: ev.name,
        time: fmt.dateParts(new Date(ev.starts_at), {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        day: fmt.date(ev.starts_at),
        sub: t("m.home.upcoming.sub", undefined, "Upcoming Event"),
      }
    : null;

  const displayName =
    ((me as { name: string | null } | null)?.name ?? "").trim() ||
    ((session.email ?? "").split("@")[0] ?? "").replace(/[._-]+/g, " ").trim() ||
    "Crew";

  const data: HomeData = {
    openTasks: openTasks ?? 0,
    myAdvances: myAdvances ?? 0,
    unread: unread ?? 0,
    nextShift,
    rose: {
      // users.name when set; the email local-part otherwise — never blank,
      // the Rose is the identity card.
      holderName: displayName,
      credentialLabel: station.manningId !== "—" ? `ID ${station.manningId}` : null,
    },
    station: {
      manningId: station.manningId,
      assembly: station.assembly,
      // The kit's card names the crew member's emergency ROLE. The station
      // resolver calls the same fact `position` (their assignment title).
      emergencyRole: station.position,
    },
  };

  const greeting = fmt.dateParts(new Date(), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const labels: HomeLabels = {
    title: t("m.home.title", undefined, "Dashboard"),
    quickActions: t("m.home.quickActions", undefined, "Quick Actions"),
    upcoming: t("m.home.upcomingLabel", undefined, "Upcoming"),
    viewAll: t("m.home.viewAll", undefined, "View All Upcoming Events"),
    noShift: t("m.home.noShift", undefined, "Nothing Scheduled"),
    noShiftBody: t("m.home.noShiftBody", undefined, "Your next call lands here."),
    qaReport: t("m.home.qa.report", undefined, "Report"),
    qaScan: t("m.home.qa.scan", undefined, "Scan"),
    qaClock: t("m.home.qa.clock", undefined, "Clock"),
    qaAdvance: t("m.home.qa.advance", undefined, "Advances"),
    qaApprove: t("m.home.qa.approve", undefined, "Approve"),
    qaExpense: t("m.home.qa.expense", undefined, "Expense"),
    qaLostFound: t("m.home.qa.lostFound", undefined, "Lost & Found"),
    qaSwap: t("m.home.qa.swap", undefined, "Swap"),
    qaInvite: t("m.home.qa.invite", undefined, "Invite"),
    qaCustomize: t("m.home.qa.customize", undefined, "Customize"),
    qaCustomizeSoon: t(
      "m.home.qa.customizeSoon",
      undefined,
      "Choosing which actions live here is coming. For now every crew member gets the same set.",
    ),
    qaCustomizeClose: t("m.home.qa.customizeClose", undefined, "Got It"),
    emergencyCard: t("m.home.emergencyCard", undefined, "Emergency Card"),
    esManning: t("m.home.es.manning", undefined, "Manning Position"),
    esAssembly: t("m.home.es.assembly", undefined, "Assembly Point"),
    esRole: t("m.home.es.role", undefined, "Emergency Role"),
    esCodes: t("m.home.es.codes", undefined, "Codes"),
    esFire: t("m.home.es.fire", undefined, "Fire Safety"),
    esEvacuate: t("m.home.es.evacuate", undefined, "Evacuate"),
    esShelter: t("m.home.es.shelter", undefined, "Shelter"),
  };

  return <HomeShell data={data} greeting={greeting} labels={labels} />;
}
