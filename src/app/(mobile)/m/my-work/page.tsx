import Link from "next/link";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · My Work — the one personal spine.
 *
 * The console has had this since the v7.8 zero-training layer: one screen
 * answering "what do I owe, and what's waiting on me?". COMPVSS had no
 * equivalent — the nearest thing was /m/tasks (tasks only) plus /m/time-off
 * (own time off), so a crew member's obligations were scattered across
 * surfaces they had to know to visit.
 *
 * Deliberately narrower than the console's seven-store union. This is the
 * field's spine, not the desk's: what's assigned to me, what I've asked
 * for, and — for the manager band — what's waiting on my decision. Rows
 * link out; nothing is decided here, because deciding belongs on the
 * surface that owns the record.
 */

type Row = { id: string; title: string; meta: string; href: string; tone: string };

function Section({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <>
      <div className="sech">
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="item" style={{ display: "block" }}>
          <div className="s">{empty}</div>
        </div>
      ) : (
        rows.map((r) => (
          <Link key={r.id} href={r.href} className="item tap" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="bar" style={{ background: `var(--p-${r.tone})` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{r.title}</div>
              <div className="s">{r.meta}</div>
            </div>
            <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
          </Link>
        ))
      )}
    </>
  );
}

export default async function MyWorkPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const manager = isManagerPlus(session);

  // Approvals: the manager band sees everything open in the org; everyone
  // sees the instances they raised themselves. Filtered on
  // OPEN_INSTANCE_STATES — `pending` is not a state the CHECK allows, and
  // querying for it is why every approvals count in the product read zero.
  let approvalsQuery = supabase
    .from("approval_instances")
    .select("id, subject_table, state, initiated_at, policy:approval_policies(name)")
    .eq("org_id", session.orgId)
    .in("state", [...OPEN_INSTANCE_STATES])
    .order("initiated_at", { ascending: false })
    .limit(8);
  if (!manager) approvalsQuery = approvalsQuery.eq("initiated_by", session.userId);

  const [tasksRes, approvalsRes, timeOffRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, task_state, due_at")
      .eq("org_id", session.orgId)
      .eq("assigned_to", session.userId)
      .in("task_state", ["todo", "in_progress", "blocked", "review"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(8),
    approvalsQuery,
    supabase
      .from("time_off_requests")
      .select("id, starts_on, ends_on, request_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .eq("request_state", "pending")
      .order("starts_on", { ascending: false })
      .limit(8),
  ]);

  const taskRows: Row[] = (tasksRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    meta: r.due_at
      ? t("m.myWork.due", { date: fmt.date(r.due_at as string) }, `Due ${fmt.date(r.due_at as string)}`)
      : t("m.myWork.noDue", undefined, "No due date"),
    href: `/m/tasks/${r.id}`,
    tone: "info",
  }));

  const approvalRows: Row[] = (approvalsRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: (r.policy as { name?: string } | null)?.name ?? (r.subject_table as string),
    meta: `${r.subject_table} · ${fmt.relative(r.initiated_at as string)}`,
    href: "/m/requests",
    tone: "warning",
  }));

  const timeOffRows: Row[] = (timeOffRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: `${fmt.date(r.starts_on as string)} → ${fmt.date(r.ends_on as string)}`,
    meta: t("m.myWork.awaitingDecision", undefined, "Awaiting a decision"),
    href: "/m/time-off",
    tone: "text-3",
  }));

  const total = taskRows.length + approvalRows.length + timeOffRows.length;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {total === 1
          ? t("m.myWork.eyebrowOne", undefined, "1 Open Item")
          : t("m.myWork.eyebrow", { count: total }, `${total} Open Items`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.myWork.title", undefined, "My Work")}
      </h1>

      {total === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.myWork.clearTitle", undefined, "You're Clear")}
          description={t(
            "m.myWork.clearBody",
            undefined,
            "Nothing assigned to you, nothing waiting on your decision, nothing pending.",
          )}
        />
      ) : (
        <>
          <Section
            title={t("m.myWork.tasks", undefined, "Assigned To You")}
            rows={taskRows}
            empty={t("m.myWork.noTasks", undefined, "No open tasks.")}
          />
          <Section
            title={
              manager
                ? t("m.myWork.approvalsManager", undefined, "Waiting On Your Decision")
                : t("m.myWork.approvalsMine", undefined, "Approvals You Raised")
            }
            rows={approvalRows}
            empty={t("m.myWork.noApprovals", undefined, "Nothing in the approval queue.")}
          />
          <Section
            title={t("m.myWork.requests", undefined, "Your Pending Requests")}
            rows={timeOffRows}
            empty={t("m.myWork.noRequests", undefined, "No pending requests.")}
          />
        </>
      )}
    </div>
  );
}
