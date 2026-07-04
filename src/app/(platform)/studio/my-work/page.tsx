import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

/**
 * My Work — the one personal spine (v7.8 zero-training layer).
 *
 * Union of everything assigned to, awaiting, or requested by the signed-in
 * user: my open tasks · approvals waiting on a decision · my open purchase
 * requisitions · my pending time off · my pending expenses. Every row opens
 * its record; every empty state teaches the first action. Bound to
 * `session.userId`, never hardcoded (design_handoff_console_rebuild README
 * §"THE ZERO-TRAINING LAYER" #3).
 */
export const dynamic = "force-dynamic";

type WorkRow = {
  id: string;
  title: string;
  meta: string;
  status: string;
  href: string;
};

export default async function MyWorkPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="page-content">{t("console.myWork.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();
  const managerPlus = isManagerPlus(session);

  // Approvals: deciders (manager+) see every pending instance in the org;
  // everyone always sees the pending instances they initiated.
  let approvalsQuery = supabase
    .from("approval_instances")
    .select("id, subject_table, subject_id, state, initiated_at, policy:approval_policies(name)", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("state", "pending")
    .order("initiated_at", { ascending: false })
    .limit(8);
  if (!managerPlus) approvalsQuery = approvalsQuery.eq("initiated_by", session.userId);

  const [tasksRes, approvalsRes, reqsRes, timeOffRes, expensesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, task_state, due_at, priority", { count: "exact" })
      .eq("org_id", session.orgId)
      .eq("assigned_to", session.userId)
      .in("task_state", ["todo", "in_progress", "blocked", "review"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(8),
    approvalsQuery,
    supabase
      .from("requisitions")
      .select("id, title, requisition_state, estimated_cents, created_at", { count: "exact" })
      .eq("org_id", session.orgId)
      .eq("requester_id", session.userId)
      .in("requisition_state", ["draft", "submitted"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("time_off_requests")
      .select("id, starts_on, ends_on, hours_requested, request_state", { count: "exact" })
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .eq("request_state", "pending")
      .order("starts_on", { ascending: false })
      .limit(8),
    supabase
      .from("expenses")
      .select("id, description, amount_cents, expense_state, spent_at", { count: "exact" })
      .eq("org_id", session.orgId)
      .eq("submitter_id", session.userId)
      .eq("expense_state", "pending")
      .order("spent_at", { ascending: false })
      .limit(8),
  ]);

  const taskCount = tasksRes.count ?? 0;
  const approvalCount = approvalsRes.count ?? 0;
  const requestCount = (reqsRes.count ?? 0) + (timeOffRes.count ?? 0) + (expensesRes.count ?? 0);

  const taskRows: WorkRow[] = (tasksRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    meta: r.due_at
      ? t("console.myWork.dueMeta", { date: fmt.date(r.due_at) }, `Due ${fmt.date(r.due_at)}`)
      : t("console.myWork.noDue", undefined, "No due date"),
    status: r.task_state,
    href: `/studio/tasks/${r.id}`,
  }));
  const approvalRows: WorkRow[] = (approvalsRes.data ?? []).map((r) => {
    const policy = (r.policy as { name?: string } | null)?.name;
    return {
      id: r.id,
      title: policy ?? r.subject_table,
      meta: `${r.subject_table} · ${fmt.relative(r.initiated_at)}`,
      status: r.state,
      href: `/studio/governance/approvals/${r.id}`,
    };
  });
  const reqRows: WorkRow[] = (reqsRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    meta: r.estimated_cents != null ? fmt.money(r.estimated_cents) : fmt.relative(r.created_at),
    status: r.requisition_state,
    href: `/studio/procurement/requisitions/${r.id}`,
  }));
  const timeOffRows: WorkRow[] = (timeOffRes.data ?? []).map((r) => ({
    id: r.id,
    title: t(
      "console.myWork.timeOffTitle",
      { start: fmt.date(r.starts_on), end: fmt.date(r.ends_on) },
      `${fmt.date(r.starts_on)} → ${fmt.date(r.ends_on)}`,
    ),
    meta: t("console.myWork.timeOffHours", { hours: fmt.number(r.hours_requested) }, `${r.hours_requested}h requested`),
    status: r.request_state,
    href: "/studio/workforce/time-off",
  }));
  const expenseRows: WorkRow[] = (expensesRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.description,
    meta: `${fmt.money(r.amount_cents)} · ${fmt.date(r.spent_at)}`,
    status: r.expense_state,
    href: `/studio/finance/expenses/${r.id}`,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.myWork.eyebrow", undefined, "Home · Your Work")}
        title={t("console.myWork.title", undefined, "My Work")}
        subtitle={t(
          "console.myWork.subtitle",
          undefined,
          "One place for everything assigned to you, awaiting your decision, or requested by you.",
        )}
        action={
          <Button href="/studio/tasks/new" size="sm">
            {t("console.myWork.newTask", undefined, "+ New Task")}
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard
            label={t("console.myWork.stats.tasks", undefined, "Open Tasks")}
            value={fmt.number(taskCount)}
            accent={taskCount > 0}
          />
          <MetricCard
            label={t("console.myWork.stats.approvals", undefined, "Approvals Pending")}
            value={fmt.number(approvalCount)}
          />
          <MetricCard label={t("console.myWork.stats.requests", undefined, "Open Requests")} value={fmt.number(requestCount)} />
        </div>

        <WorkSection
          title={t("console.myWork.sections.tasks", undefined, "My Tasks")}
          viewAllHref="/studio/tasks"
          viewAllLabel={t("console.myWork.viewAll", undefined, "View all →")}
          rows={taskRows}
          empty={t(
            "console.myWork.empty.tasks",
            undefined,
            "Nothing assigned to you. Tasks land here the moment someone assigns one, or create your own from + New Task.",
          )}
        />
        <WorkSection
          title={
            managerPlus
              ? t("console.myWork.sections.approvalsManager", undefined, "Approvals Waiting On A Decision")
              : t("console.myWork.sections.approvals", undefined, "My Approvals In Flight")
          }
          viewAllHref="/studio/governance/approvals"
          viewAllLabel={t("console.myWork.viewAll", undefined, "View all →")}
          rows={approvalRows}
          empty={t(
            "console.myWork.empty.approvals",
            undefined,
            "No approvals in flight. When a record enters a routed approval policy, it shows up here until someone decides.",
          )}
        />
        <WorkSection
          title={t("console.myWork.sections.requisitions", undefined, "My Purchase Requisitions")}
          viewAllHref="/studio/procurement/requisitions"
          viewAllLabel={t("console.myWork.viewAll", undefined, "View all →")}
          rows={reqRows}
          empty={t(
            "console.myWork.empty.requisitions",
            undefined,
            "No open requisitions. Need something bought? Start one from the + menu; it converts to a PO once approved.",
          )}
          emptyAction={{ href: "/studio/procurement/requisitions/new", label: t("console.myWork.requestPurchase", undefined, "Request A Purchase") }}
        />
        <WorkSection
          title={t("console.myWork.sections.timeOff", undefined, "My Time Off")}
          viewAllHref="/studio/workforce/time-off"
          viewAllLabel={t("console.myWork.viewAll", undefined, "View all →")}
          rows={timeOffRows}
          empty={t(
            "console.myWork.empty.timeOff",
            undefined,
            "No pending time off. Requests you submit wait here until they are approved.",
          )}
          emptyAction={{ href: "/studio/workforce/time-off", label: t("console.myWork.requestTimeOff", undefined, "Request Time Off") }}
        />
        <WorkSection
          title={t("console.myWork.sections.expenses", undefined, "My Pending Expenses")}
          viewAllHref="/studio/finance/expenses"
          viewAllLabel={t("console.myWork.viewAll", undefined, "View all →")}
          rows={expenseRows}
          empty={t(
            "console.myWork.empty.expenses",
            undefined,
            "No pending expenses. Submit one and track it here until it is approved and reimbursed.",
          )}
          emptyAction={{ href: "/studio/finance/expenses/new", label: t("console.myWork.submitExpense", undefined, "Submit An Expense") }}
        />
      </div>
    </>
  );
}

function WorkSection({
  title,
  viewAllHref,
  viewAllLabel,
  rows,
  empty,
  emptyAction,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  rows: WorkRow[];
  empty: string;
  emptyAction?: { href: string; label: string };
}) {
  return (
    <section>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={viewAllHref} className="text-xs font-medium text-[var(--p-accent)] hover:underline">
          {viewAllLabel}
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="surface flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs text-[var(--p-text-2)]">{empty}</p>
          {emptyAction ? (
            <Button href={emptyAction.href} size="sm" variant="ghost">
              {emptyAction.label}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <ul>
            {rows.map((r) => (
              <li key={r.id} className="border-b border-[var(--p-border)] last:border-0">
                <Link
                  href={r.href}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--p-surface-2)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--p-text-1)]">{r.title}</span>
                    <span className="block truncate text-xs text-[var(--p-text-2)]">{r.meta}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
