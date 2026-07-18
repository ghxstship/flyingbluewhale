import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { ApprovalDeck, EscalateSwipe, type DeckCard } from "./ApprovalDeck";

export const dynamic = "force-dynamic";

/**
 * /m/requests — the field approvals queue, on the REAL approvals engine
 * (approval.clear, kit 28 backlog §3 item 3).
 *
 * This surface used to be a hand-rolled two-table queue (time-off + shift
 * swaps) that never touched `approval_instances` — the engine every routed
 * record (POs, change orders, …) actually waits in. Now it IS the engine:
 *
 *   · Manager band: the org's open instances as a decision deck, oldest
 *     first (the one that's been waiting longest is the top card). Writes
 *     go through the `record_approval_decision` RPC — the same single
 *     transaction the console uses.
 *   · Members: their own initiated instances, read-only — the same split
 *     `/m/my-work` and `/studio/my-work` draw (`initiated_by` bound to the
 *     caller; RLS is `is_org_member`, so the filter must be explicit).
 *
 * Time-off and swap decisions live on their own stores and consoles
 * (`/studio/workforce/time-off`, `/studio/workforce/shift-swaps`); this
 * surface no longer duplicates them.
 *
 * `approval_instances` carries no `deleted_at` (not in
 * SOFT_DELETABLE_TABLES) — no soft-delete guard applies here.
 */

type InstanceRow = {
  id: string;
  subject_table: string;
  state: string;
  current_step_id: string | null;
  policy_id: string;
  initiated_at: string;
  initiated_by: string | null;
  metadata: unknown;
  policy: { name: string } | null;
};

/** metadata is free-form jsonb; routeToApprovals callers conventionally pass
 *  `{ number, title, amountCents }` (see the PO / change-order actions). */
function readMeta(metadata: unknown): { title: string | null; number: string | null; amountCents: number | null } {
  const m = (metadata ?? {}) as Record<string, unknown>;
  return {
    title: typeof m.title === "string" && m.title ? m.title : null,
    number: typeof m.number === "string" && m.number ? m.number : null,
    amountCents: typeof m.amountCents === "number" && Number.isFinite(m.amountCents) ? m.amountCents : null,
  };
}

/** "po_change_orders" → "Po Change Orders" — a readable kind chip without a
 *  hand-kept label map that would go stale on the next routed table. */
function humanizeSubject(subjectTable: string): string {
  return subjectTable.replace(/_/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

const STATE_TONE: Record<string, string> = {
  initiated: "warn",
  in_review: "warn",
  escalated: "warn",
  returned: "info",
  approved: "ok",
  rejected: "danger",
  closed: "neutral",
  cancelled: "neutral",
};

function stateLabel(s: string): string {
  const words = s.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function MobileRequestsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.requests.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.requests.title", undefined, "Approvals")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const manager = isManagerPlus(session);

  let query = supabase
    .from("approval_instances")
    .select("id, subject_table, state, current_step_id, policy_id, initiated_at, initiated_by, metadata, policy:approval_policies(name)")
    .eq("org_id", session.orgId);
  if (manager) {
    // The deck: open instances only, oldest first — clear the queue.
    query = query.in("state", [...OPEN_INSTANCE_STATES]).order("initiated_at", { ascending: true }).limit(50);
  } else {
    // Read-only status view: my own initiated instances, newest first.
    query = query.eq("initiated_by", session.userId).order("initiated_at", { ascending: false }).limit(100);
  }
  const { data } = await query;
  const rows = (data ?? []) as unknown as InstanceRow[];

  // The RPC lands a decision on a step of the instance's policy. Instances
  // seeded before their policy had steps carry current_step_id = null — fall
  // back to the policy's first step (exactly what the console detail does).
  const orphanPolicyIds = Array.from(
    new Set(rows.filter((r) => r.current_step_id == null).map((r) => r.policy_id)),
  );
  // Hydrate requester names (initiated_by is an auth uid). The orphan-policy
  // first-step backfill and this name hydration both derive from the instance
  // rows and are independent — one round trip.
  const userIds = Array.from(new Set(rows.map((r) => r.initiated_by).filter((v): v is string => v != null)));
  const [stepsRes, usersRes] = await Promise.all([
    manager && orphanPolicyIds.length
      ? supabase
          .from("approval_steps")
          .select("id, policy_id, step_number")
          .in("policy_id", orphanPolicyIds)
          .order("step_number", { ascending: true })
      : null,
    userIds.length ? supabase.from("users").select("id, name, email").in("id", userIds) : null,
  ]);
  const firstStepByPolicy = new Map<string, string>();
  for (const s of (stepsRes?.data ?? []) as Array<{ id: string; policy_id: string }>) {
    if (!firstStepByPolicy.has(s.policy_id)) firstStepByPolicy.set(s.policy_id, s.id);
  }
  const nameMap = new Map<string, string>();
  for (const u of (usersRes?.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    nameMap.set(u.id, u.name || u.email || t("m.requests.someone", undefined, "Someone"));
  }
  const nameFor = (id: string | null) =>
    (id && nameMap.get(id)) || t("m.requests.someone", undefined, "Someone");

  const cards: DeckCard[] = rows.map((r) => {
    const meta = readMeta(r.metadata);
    const summary =
      meta.title && meta.number ? `${meta.number} · ${meta.title}` : (meta.title ?? meta.number);
    return {
      id: r.id,
      stepId: r.current_step_id ?? firstStepByPolicy.get(r.policy_id) ?? null,
      title: r.policy?.name ?? humanizeSubject(r.subject_table),
      kind: humanizeSubject(r.subject_table),
      requester: nameFor(r.initiated_by),
      summary,
      amount: meta.amountCents != null ? fmt.money(meta.amountCents) : null,
      age: fmt.relative(r.initiated_at),
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.requests.eyebrow", undefined, "Field")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.requests.title", undefined, "Approvals")}
      </h1>

      {manager ? (
        <ApprovalDeck cards={cards} />
      ) : cards.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.requests.mine.emptyTitle", undefined, "Nothing In Review")}
          description={t(
            "m.requests.mine.emptyBody",
            undefined,
            "Records you send for approval show their review status here.",
          )}
        />
      ) : (
        <>
          <div className="sech">
            <h2>{t("m.requests.mine.head", undefined, "Your Submissions")}</h2>
          </div>
          {rows.map((r) => {
            const card = cards.find((c) => c.id === r.id);
            const tone = STATE_TONE[r.state] ?? "neutral";
            // Kit 31 swipe canon: the decision is not yours → Escalate (warn)
            // on still-open submissions (bell + push to the manager band).
            const open = ["initiated", "in_review", "escalated"].includes(r.state);
            return (
              <EscalateSwipe key={r.id} instanceId={r.id} title={card?.title ?? ""} open={open}>
                <div className="item" style={{ margin: 0 }}>
                  <KIcon
                    name="FileCheck"
                    size={18}
                    style={{ color: "var(--p-text-2)", flex: "none" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{card?.title}</div>
                    <div className="s">
                      {card?.kind} · {card?.age}
                      {card?.amount ? ` · ${card.amount}` : ""}
                    </div>
                  </div>
                  <span className={`ps-badge ps-badge--${tone}`}>
                    {t(`m.requests.state.${r.state}`, undefined, stateLabel(r.state))}
                  </span>
                </div>
              </EscalateSwipe>
            );
          })}
        </>
      )}
    </div>
  );
}
