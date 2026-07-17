"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideApprovalAction } from "./actions";

/** Queue channel — one constant so enqueue and drain agree (kit 21 W8). */
const QUEUE_KIND = "approval-clear";

type Decision = "approved" | "rejected";

export type DeckCard = {
  /** approval_instances.id */
  id: string;
  /** The step the decision lands on (current_step_id, or the policy's first
   *  step). Null = stepless policy — undecidable ANYWHERE (the RPC requires
   *  a step belonging to the policy); rendered read-only with a hint. */
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

/**
 * COMPVSS · Approval deck — one card, one decision.
 *
 * The manager band's clear-the-queue flow over `approval_instances`: the
 * oldest open instance is the top card; Approve / Decline are two large
 * thumb targets (no swipe lib exists in the repo, and buttons are the
 * honest UX — a swipe you can't take back is a decision you didn't mean);
 * "Decide Later" rotates the card to the back without deciding.
 *
 * Decisions queue offline (CrisisPanel precedent): a stable id per instance
 * means a double tap or an offline reload re-enqueues onto the same slot,
 * and the server RPC rejects terminal instances so a stale replay after
 * someone else decided resolves as superseded, not as a duplicate write.
 * The card clears optimistically on "sent" AND "queued" — the queued state
 * is surfaced by the sync banner, not by pretending the tap failed.
 */
export function ApprovalDeck({ cards }: { cards: DeckCard[] }) {
  const t = useT();
  const router = useRouter();
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set());
  const [deferred, setDeferred] = useState<readonly string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { online, pending, syncing, submit } = useOfflineQueue<Payload>(QUEUE_KIND, async (payload) => {
    const res = await decideApprovalAction(payload);
    if (res?.error) {
      setError(res.error);
      return false; // business error — surface it, don't retry forever
    }
    return true;
  });

  const decidable = useMemo(() => cards.filter((c) => c.stepId != null), [cards]);
  const stepless = useMemo(() => cards.filter((c) => c.stepId == null), [cards]);

  // Deck order: server order (oldest first), minus cleared, with deferred
  // cards rotated to the back in the order they were skipped.
  const remaining = useMemo(() => {
    const open = decidable.filter((c) => !cleared.has(c.id));
    const deferredSet = new Set(deferred);
    const front = open.filter((c) => !deferredSet.has(c.id));
    const back = deferred
      .map((id) => open.find((c) => c.id === id))
      .filter((c): c is DeckCard => c != null);
    return [...front, ...back];
  }, [decidable, cleared, deferred]);

  const card = remaining[0] ?? null;
  const clearedCount = decidable.length - remaining.length;

  async function decide(target: DeckCard, decision: Decision) {
    if (busy || !target.stepId) return;
    setError(null);
    setBusy(decision);
    try {
      // Stable id: one queue slot per instance — the last decision made
      // while offline is the one that replays.
      const outcome = await submit(`${QUEUE_KIND}-${target.id}`, {
        instanceId: target.id,
        stepId: target.stepId,
        decision,
        notes: note.trim() || undefined,
      });
      if (outcome === "failed") return; // error already surfaced by send
      setCleared((prev) => new Set(prev).add(target.id));
      setDeferred((prev) => prev.filter((id) => id !== target.id));
      setNote("");
      if (outcome === "sent") router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function defer(target: DeckCard) {
    if (busy) return;
    setNote("");
    setDeferred((prev) => [...prev.filter((id) => id !== target.id), target.id]);
  }

  return (
    <section aria-label={t("m.requests.deck.section", undefined, "Approval Deck")}>
      <OfflineSyncBanner
        online={online}
        pending={pending}
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

      {card == null ? (
        <EmptyState
          size="compact"
          title={t("m.requests.empty.title", undefined, "All Clear")}
          description={
            clearedCount > 0
              ? t("m.requests.deck.clearedAll", undefined, "Queue cleared. Nothing waits on your decision.")
              : t("m.requests.deck.emptyBody", undefined, "Nothing waits on your decision right now.")
          }
        />
      ) : (
        <>
          {/* Deck position — how much queue is left, not a pager. */}
          <div className="sech">
            <h2>
              {remaining.length === 1
                ? t("m.requests.deck.oneLeft", undefined, "1 To Clear")
                : t("m.requests.deck.left", { n: remaining.length }, `${remaining.length} To Clear`)}
            </h2>
          </div>

          <div className="item" style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <KIcon
                name="CheckCheck"
                size={18}
                style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{card.title}</div>
                <div className="s">
                  {card.kind} · {card.requester} · {card.age}
                </div>
              </div>
            </div>

            {(card.summary || card.amount) && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                {card.summary && (
                  <div className="s" style={{ flex: 1, minWidth: 0 }}>
                    {card.summary}
                  </div>
                )}
                {card.amount && (
                  <div className="t" style={{ flex: "none" }}>
                    {card.amount}
                  </div>
                )}
              </div>
            )}

            <textarea
              className="ps-input"
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("m.requests.deck.notePlaceholder", undefined, "Add a note (optional)")}
              style={{ width: "100%", marginTop: 10 }}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={busy != null}
                onClick={() => decide(card, "approved")}
              >
                <KIcon name="Check" size={15} />{" "}
                {busy === "approved"
                  ? t("m.requests.deck.sending", undefined, "Sending…")
                  : t("m.requests.approve", undefined, "Approve")}
              </button>
              <button
                type="button"
                className="ps-btn ps-btn--danger ps-btn--lg"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={busy != null}
                onClick={() => decide(card, "rejected")}
              >
                <KIcon name="X" size={15} />{" "}
                {busy === "rejected"
                  ? t("m.requests.deck.sending", undefined, "Sending…")
                  : t("m.requests.decline", undefined, "Decline")}
              </button>
            </div>

            {remaining.length > 1 && (
              <button
                type="button"
                className="ps-btn ps-btn--ghost"
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                disabled={busy != null}
                onClick={() => defer(card)}
              >
                {t("m.requests.deck.later", undefined, "Decide Later")}
              </button>
            )}
          </div>
        </>
      )}

      {/* Stepless policies: the RPC (and the console) can only land a
          decision on a policy step, so these are undecidable everywhere
          until the policy gains steps. Shown, not hidden — an invisible
          queue item is how something waits forever. */}
      {stepless.length > 0 && (
        <>
          <div className="sech">
            <h2>{t("m.requests.deck.steplessHead", undefined, "Waiting On Policy Setup")}</h2>
          </div>
          {stepless.map((c) => (
            <div className="item" key={c.id}>
              <span className="bar" style={{ background: "var(--p-warning)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{c.title}</div>
                <div className="s">
                  {c.kind} · {c.requester} · {c.age}
                </div>
              </div>
            </div>
          ))}
          <p className="hint" style={{ marginTop: 4 }}>
            {t(
              "m.requests.deck.steplessHint",
              undefined,
              "These policies have no review steps yet, so no decision can be recorded. Add steps under Governance · Approvals in the console.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
