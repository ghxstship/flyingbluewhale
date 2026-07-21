"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  KIcon,
  NormalizedList,
  SwipeRow,
  UndoBar,
  useUndo,
  type FieldDef,
} from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideApprovalAction, escalateApprovalAction } from "./actions";

/** Queue channel — one constant so enqueue and drain agree (kit 21 W8). */
const QUEUE_KIND = "approval-clear";

type Decision = "approved" | "rejected";

export type DeckCard = {
  /** approval_instances.id */
  id: string;
  /** The step the decision lands on (current_step_id, or the policy's first
   *  step). Null = stepless policy — undecidable ANYWHERE (the RPC requires
   *  a step belonging to the policy); swipe offers Escalate instead. */
  stepId: string | null;
  /** Policy name (the console's title for the same instance). */
  title: string;
  /** Humanized subject_table — what kind of record is asking. */
  kind: string;
  requester: string;
  /** metadata.title / number from routeToApprovals, when the caller passed one. */
  summary: string | null;
  /** Formatted money from metadata.amountCents, when present. */
  amount: string | null;
  /** Relative age ("3d ago") — how long this has been waiting. */
  age: string;
};

type Payload = { instanceId: string; stepId: string; decision: Decision; notes?: string };

/** Undo window before a swipe decision commits (matches the kit's undo bar). */
const COMMIT_MS = 5000;

/**
 * COMPVSS · Approvals queue — kit 31 (v2.7) swipe canon.
 *
 * The manager band's clear-the-queue list over `approval_instances`: kit
 * ActionBar (search · group None/Type/Submitter · sort Recent/Type/Submitter),
 * kit `.item` rows, and the swipe zone — Approve (ok) / Deny (danger) when the
 * decision is decidable by you, Escalate (warn) on stepless instances that
 * cannot take a decision anywhere yet.
 *
 * A swiped decision leaves the queue immediately and arms the 5s undo bar;
 * the RPC write happens when the undo window lapses (an RPC decision is
 * terminal — committing first would make Undo a lie). The write itself rides
 * the offline queue (CrisisPanel precedent): a stable id per instance means a
 * double swipe or an offline reload re-enqueues onto the same slot, and the
 * server RPC rejects terminal instances so a stale replay after someone else
 * decided resolves as superseded, not as a duplicate write. On decision the
 * server notifies the submitter (bell row + push).
 */
export function ApprovalDeck({ cards }: { cards: DeckCard[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set());
  const [escalated, setEscalated] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { undo, withUndo, clearUndo } = useUndo();
  // Decisions waiting out their undo window: instanceId → armed commit.
  const pending = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; card: DeckCard; decision: Decision }>
  >(new Map());

  const { online, pending: queued, syncing, submit } = useOfflineQueue<Payload>(QUEUE_KIND, async (payload) => {
    const res = await decideApprovalAction(payload);
    if (res?.error) {
      setError(res.error);
      return false; // business error — surface it, don't retry forever
    }
    return true;
  });

  const commit = (target: DeckCard, decision: Decision) => {
    void (async () => {
      const outcome = await submit(`${QUEUE_KIND}-${target.id}`, {
        instanceId: target.id,
        stepId: target.stepId!,
        decision,
      });
      if (outcome === "sent") router.refresh();
    })();
  };
  // Keep the ref pointing at the latest `commit` closure (submit/router) —
  // synced in an effect, not during render (React-compiler safe).
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  // Flush still-pending commits if the list unmounts mid-window — the
  // decision was taken; navigating away must not silently drop it.
  useEffect(() => {
    const armed = pending.current;
    return () => {
      armed.forEach(({ timer, card, decision }) => {
        clearTimeout(timer);
        commitRef.current(card, decision);
      });
      armed.clear();
    };
  }, []);

  const decide = (target: DeckCard, decision: Decision) => {
    if (!target.stepId || pending.current.has(target.id)) return;
    setError(null);
    setCleared((prev) => new Set(prev).add(target.id));
    const timer = setTimeout(() => {
      pending.current.delete(target.id);
      commit(target, decision);
    }, COMMIT_MS);
    pending.current.set(target.id, { timer, card: target, decision });
    const verdict =
      decision === "approved"
        ? t("m.requests.swipe.approved", undefined, "Approved")
        : t("m.requests.swipe.denied", undefined, "Denied");
    withUndo(`${verdict} · ${target.title}`, () => {
      const armed = pending.current.get(target.id);
      if (armed) {
        clearTimeout(armed.timer);
        pending.current.delete(target.id);
      }
      setCleared((prev) => {
        const n = new Set(prev);
        n.delete(target.id);
        return n;
      });
    });
  };

  const escalate = (target: DeckCard) => {
    setEscalated((prev) => new Set(prev).add(target.id));
    const fd = new FormData();
    fd.set("instanceId", target.id);
    startTransition(async () => {
      const res = await escalateApprovalAction(null, fd);
      if (res?.error) {
        setEscalated((prev) => {
          const n = new Set(prev);
          n.delete(target.id);
          return n;
        });
        toast.error(res.error);
        return;
      }
      toast.warning(t("m.requests.swipe.escalatedToast", undefined, "Escalated"), { description: target.title });
    });
  };

  // The undo `cleared` pre-filter; NormalizedList handles search + kind pills +
  // drawer sort/filter/group over what's left.
  const remaining = useMemo(() => cards.filter((c) => !cleared.has(c.id)), [cards, cleared]);
  const kinds = useMemo(() => [...new Set(cards.map((c) => c.kind))], [cards]);

  const FIELDS: FieldDef<DeckCard>[] = [
    { id: "title", label: t("m.requests.col.request", undefined, "Request"), type: "text", get: (c) => c.title },
    { id: "kind", label: t("m.requests.col.type", undefined, "Type"), type: "select", options: kinds, get: (c) => c.kind },
    { id: "requester", label: t("m.requests.group.submitter", undefined, "Submitter"), type: "text", get: (c) => c.requester },
    { id: "age", label: t("m.requests.col.stage", undefined, "Stage"), type: "text", get: (c) => c.age },
    { id: "amount", label: "Amount", type: "text", get: (c) => c.amount ?? "" },
  ];

  const row = (c: DeckCard) => {
    const mine = c.stepId != null;
    return (
      <SwipeRow
        key={c.id}
        actions={
          mine
            ? [
                {
                  icon: "Check",
                  label: t("m.requests.approve", undefined, "Approve"),
                  tone: "ok",
                  on: () => decide(c, "approved"),
                },
                {
                  icon: "X",
                  label: t("m.requests.swipe.deny", undefined, "Deny"),
                  tone: "danger",
                  on: () => decide(c, "rejected"),
                },
              ]
            : [
                {
                  icon: "TrendingUp",
                  label: t("m.requests.swipe.escalate", undefined, "Escalate"),
                  tone: "warn",
                  on: () => escalate(c),
                },
              ]
        }
      >
        <div className="item" style={{ margin: 0 }}>
          <span className="bar" style={{ background: mine ? "var(--p-warning)" : "var(--p-border)" }} />
          <KIcon name="CheckCheck" size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{c.title}</div>
            <div className="s">
              {c.kind} · {c.requester} · {c.age}
              {c.summary ? ` · ${c.summary}` : ""}
              {c.amount ? ` · ${c.amount}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {mine ? (
              <span className="ps-badge ps-badge--warn">{t("m.requests.yourAction", undefined, "Your Action")}</span>
            ) : (
              <span className="ps-badge ps-badge--neutral">
                {t("m.requests.deck.steplessBadge", undefined, "No Steps")}
              </span>
            )}
            {escalated.has(c.id) && (
              <span
                className="s"
                style={{ fontSize: 11, color: "var(--p-danger)", display: "flex", alignItems: "center", gap: 3 }}
              >
                <KIcon name="TrendingUp" size={10} /> {t("m.requests.escalatedTag", undefined, "Escalated")}
              </span>
            )}
          </div>
        </div>
      </SwipeRow>
    );
  };

  return (
    <section aria-label={t("m.requests.deck.section", undefined, "Approvals Queue")}>
      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={syncing}
        labels={{
          offline: t(
            "m.requests.deck.offline",
            undefined,
            "You're offline. Decisions save to your device and sync later.",
          ),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <NormalizedList
        k="ap"
        items={remaining}
        fields={FIELDS}
        search={(c) => `${c.title} ${c.kind} ${c.requester} ${c.summary ?? ""}`}
        searchPlaceholder={t("m.requests.search", undefined, "Search Approvals…")}
        renderRow={row}
        views={["list", "table"]}
        pill={{ get: (c) => c.kind, order: kinds }}
        empty={{
          cols: [
            t("m.requests.col.request", undefined, "Request"),
            t("m.requests.col.type", undefined, "Type"),
            t("m.requests.col.stage", undefined, "Stage"),
          ],
          title: t("m.requests.empty.title", undefined, "All Clear"),
          hint: t("m.requests.deck.emptyBody", undefined, "Nothing waits on your decision right now."),
        }}
      />

      {remaining.some((c) => c.stepId == null) && (
        <p className="hint" style={{ marginTop: 4 }}>
          {t(
            "m.requests.deck.steplessHint",
            undefined,
            "Instances marked No Steps have no review steps yet, so no decision can be recorded. Escalate pings the org admins; steps are added under Governance · Approvals in the console.",
          )}
        </p>
      )}

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.undo", undefined, "Undo")} />
    </section>
  );
}

/**
 * Member-side swipe: the decision is NOT yours, so the canon offers Escalate
 * (warn) — a real nudge (bell rows + push to the manager band) on your own
 * still-open submission. Decided rows render plain.
 */
export function EscalateSwipe({
  instanceId,
  title,
  open,
  children,
}: {
  instanceId: string;
  title: string;
  open: boolean;
  children: ReactNode;
}) {
  const t = useT();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  if (!open) return <>{children}</>;
  return (
    <SwipeRow
      actions={[
        {
          icon: "TrendingUp",
          label: t("m.requests.swipe.escalate", undefined, "Escalate"),
          tone: "warn",
          on: () => {
            if (done) {
              toast.info(t("m.requests.escalatedTag", undefined, "Escalated"), { description: title });
              return;
            }
            const fd = new FormData();
            fd.set("instanceId", instanceId);
            startTransition(async () => {
              const res = await escalateApprovalAction(null, fd);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              setDone(true);
              toast.warning(t("m.requests.swipe.escalatedToast", undefined, "Escalated"), { description: title });
            });
          },
        },
      ]}
    >
      {children}
    </SwipeRow>
  );
}
