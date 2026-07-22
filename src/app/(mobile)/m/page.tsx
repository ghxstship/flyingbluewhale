import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";
import { HomeShell, type HomeData, type HomeLabels } from "./HomeShell";
import { resolveQuickActions } from "@/lib/mobile/quick-actions";
import type { QuickApproval } from "./ApprovalsQuickSheet";
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
  const manager = isManagerPlus(session);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: openTasks }, { count: myAdvances }, { count: unread }, { data: ev }, { data: me }, station, { data: apRows }, { data: prefRow }] =
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
      // `event_state` was fetched and never used, so the hero could announce a
      // CANCELLED or still-DRAFT event as your next one. Only a committed event
      // counts as upcoming.
      .in("event_state", ["scheduled", "live"])
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
    // Approve quick-action drawer feed (kit 32 drawer canon v2.8) — the
    // manager band's open instances, oldest first, same store /m/requests
    // reads. Members get `data: null` → the tile stays a plain link.
    manager
      ? supabase
          .from("approval_instances")
          .select("id, subject_table, current_step_id, policy_id, initiated_at, initiated_by, policy:approval_policies(name)")
          .eq("org_id", session.orgId)
          .in("state", [...OPEN_INSTANCE_STATES])
          .order("initiated_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: null }),
    // The caller's customized Home quick-action set (ui_state.quick_actions).
    supabase.from("user_preferences").select("ui_state").eq("user_id", session.userId).maybeSingle(),
  ]);

  const quickActions = resolveQuickActions((prefRow?.ui_state as Record<string, unknown> | null)?.quick_actions);

  // Hydrate the drawer cards: stepless instances fall back to the policy's
  // first step (the console + /m/requests behavior), requester names resolve
  // in one round trip. Manager-only work — members skip all of it.
  let approvals: QuickApproval[] | null = null;
  if (manager && apRows) {
    type ApRow = {
      id: string;
      subject_table: string;
      current_step_id: string | null;
      policy_id: string;
      initiated_at: string;
      initiated_by: string | null;
      policy: { name: string } | null;
    };
    const rows = (apRows ?? []) as unknown as ApRow[];
    const orphanPolicyIds = Array.from(new Set(rows.filter((r) => r.current_step_id == null).map((r) => r.policy_id)));
    const userIds = Array.from(new Set(rows.map((r) => r.initiated_by).filter((v): v is string => v != null)));
    // First-step backfill + requester names both derive from the instance rows
    // and are independent — one round trip.
    const [stepsRes, usersRes] = await Promise.all([
      orphanPolicyIds.length
        ? supabase
            .from("approval_steps")
            .select("id, policy_id, step_number")
            .in("policy_id", orphanPolicyIds)
            .order("step_number", { ascending: true })
        : null,
      userIds.length
        ? supabase.from("users").select("id, name, email").in("id", userIds).is("deleted_at", null)
        : null,
    ]);
    const firstStepByPolicy = new Map<string, string>();
    for (const s of (stepsRes?.data ?? []) as Array<{ id: string; policy_id: string }>) {
      if (!firstStepByPolicy.has(s.policy_id)) firstStepByPolicy.set(s.policy_id, s.id);
    }
    const nameMap = new Map<string, string>();
    for (const u of (usersRes?.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name || u.email || t("m.requests.someone", undefined, "Someone"));
    }
    const humanize = (s: string) => s.replace(/_/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    approvals = rows.map((r) => ({
      id: r.id,
      stepId: r.current_step_id ?? firstStepByPolicy.get(r.policy_id) ?? null,
      title: r.policy?.name ?? humanize(r.subject_table),
      kind: humanize(r.subject_table),
      requester: (r.initiated_by && nameMap.get(r.initiated_by)) || t("m.requests.someone", undefined, "Someone"),
      age: fmt.relative(r.initiated_at),
    }));
  }

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
    t("m.home.crewFallback", undefined, "Crew");

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
    approvals,
  };

  // Kit 31 (live-test resolution #10): the Home eyebrow is the FULL date —
  // weekday, month, day AND year ("Friday, July 17, 2026").
  const greeting = fmt.dateParts(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
    qaInspect: t("m.home.qa.inspect", undefined, "Inspect"),
    qaTimeoff: t("m.home.qa.timeoff", undefined, "Time Off"),
    qaPo: t("m.home.qa.po", undefined, "PO Request"),
    qaCustomize: t("m.home.qa.customize", undefined, "Customize"),
    qaCustomizeHint: t(
      "m.home.qa.customizeHint",
      undefined,
      "Reorder with the arrows, tap − to remove, + to add. Saved to your dashboard.",
    ),
    qaAvailable: t("m.home.qa.available", undefined, "Available"),
    qaCustomizeClose: t("m.home.qa.customizeClose", undefined, "Done"),
    emergencyCard: t("m.home.emergencyCard", undefined, "Emergency Card"),
    esManning: t("m.home.es.manning", undefined, "Manning Position"),
    esAssembly: t("m.home.es.assembly", undefined, "Assembly Point"),
    esRole: t("m.home.es.role", undefined, "Emergency Role"),
    esCodes: t("m.home.es.codes", undefined, "Codes"),
    esFire: t("m.home.es.fire", undefined, "Fire Safety"),
    esEvacuate: t("m.home.es.evacuate", undefined, "Evacuate"),
    esShelter: t("m.home.es.shelter", undefined, "Shelter"),
  };

  return <HomeShell data={data} greeting={greeting} labels={labels} quickActions={quickActions} />;
}
