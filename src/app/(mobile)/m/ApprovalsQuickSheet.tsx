"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KIcon, Sheet, UndoBar, useUndo } from "@/components/mobile/kit";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideApprovalAction } from "./requests/actions";

/**
 * Home · Approve quick-action drawer — kit 32 Drawer System (v2.8).
 *
 * ACTION drawer with inline decisions: the kit's `approveSheet` lists the
 * instances waiting on YOU with ✓ / ✕ per row. Canon rule: inline decisions
 * MUST mutate the same store as the full surface — so this rides the exact
 * `/m/requests` path: `decideApprovalAction` → `record_approval_decision`
 * RPC (kit 31 #25), the 5s delayed-commit undo, and the SAME offline-queue
 * channel (`approval-clear`), so a decision taken here and one taken on the
 * deck are indistinguishable server-side. Never toast-only.
 *
 * Empty state: "All Caught Up" (kit v2.8 approvals normalization).
 */

const QUEUE_KIND = "approval-clear"; // must match /m/requests/ApprovalDeck.tsx

type Decision = "approved" | "rejected";

export type QuickApproval = {
  /** approval_instances.id */
  id: string;
  /** The step the decision lands on — null means undecidable (stepless). */
  stepId: string | null;
  title: string;
  kind: string;
  requester: string;
  age: string;
};

type Payload = { instanceId: string; stepId: string; decision: Decision };

const COMMIT_MS = 5000;

export function ApprovalsQuickSheet({ cards, onClose }: { cards: QuickApproval[]; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { undo, withUndo, clearUndo } = useUndo();
  const pending = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; card: QuickApproval; decision: Decision }>
  >(new Map());

  const { submit } = useOfflineQueue<Payload>(QUEUE_KIND, async (payload) => {
    const res = await decideApprovalAction(payload);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    return true;
  });

  const commit = (target: QuickApproval, decision: Decision) => {
    void (async () => {
      const outcome = await submit(`${QUEUE_KIND}-${target.id}`, {
        instanceId: target.id,
        stepId: target.stepId!,
        decision,
      });
      if (outcome === "sent") router.refresh();
    })();
  };
  const commitRef = useRef(commit);
  // Synced in an effect — writing a ref during render trips react-hooks/refs
  // (the deck's inline assignment predates the rule).
  useEffect(() => {
    commitRef.current = commit;
  });

  // A decision taken in the drawer must survive the drawer closing: flush
  // still-armed commits on unmount instead of silently dropping them.
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

  const decide = (target: QuickApproval, decision: Decision) => {
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

  const mine = cards.filter((c) => c.stepId != null && !cleared.has(c.id));

  return (
    <Sheet
      icon="CheckCheck"
      title={t("m.home.approveSheet.title", undefined, "Approvals")}
      sub={t(
        "m.home.approveSheet.sub",
        { n: mine.length },
        `${mine.length} Waiting On You`,
      )}
      closeLabel={t("m.home.approveSheet.close", undefined, "Close")}
      onClose={onClose}
    >
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {mine.length === 0 ? (
        <div className="hint" style={{ padding: "14px 0" }}>
          {t("m.home.approveSheet.empty", undefined, "All Caught Up · Nothing Waiting On You")}
        </div>
      ) : (
        mine.map((a) => (
          <div className="item" key={a.id} style={{ alignItems: "center" }}>
            <KIcon name="FileCheck" size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{a.title}</div>
              <div className="s">
                {a.kind} · {a.requester} · {a.age}
              </div>
            </div>
            <button
              type="button"
              className="addrm"
              style={{
                width: 34,
                height: 34,
                color: "var(--p-danger)",
                border: "1px solid var(--p-border)",
                borderRadius: 9,
                background: "var(--p-surface)",
                cursor: "pointer",
              }}
              aria-label={t("m.requests.swipe.deny", undefined, "Deny")}
              onClick={() => decide(a, "rejected")}
            >
              <KIcon name="X" size={16} />
            </button>
            <button
              type="button"
              className="addrm"
              style={{
                width: 34,
                height: 34,
                color: "var(--p-on-strong)",
                background: "var(--p-success)",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
              }}
              aria-label={t("m.requests.approve", undefined, "Approve")}
              onClick={() => decide(a, "approved")}
            >
              <KIcon name="Check" size={16} />
            </button>
          </div>
        ))
      )}

      <Link
        href="/m/requests"
        className="viewall"
        onClick={onClose}
        style={{ marginTop: 6 }}
      >
        {t("m.home.approveSheet.viewAll", undefined, "Open Approvals")} <KIcon name="ArrowRight" size={15} />
      </Link>

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.undo", undefined, "Undo")} />
    </Sheet>
  );
}
