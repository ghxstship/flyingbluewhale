"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { moveAssetCustody } from "./actions";

export type CustodyTarget = { id: string; tag: string; state: string; status: string };

/**
 * Take or return custody of a specific asset.
 *
 * COMPVSS shipped an "Assets" tab that could read the unified store and
 * never write it: tapping a unit called `onToast={() => {}}` — a literal
 * no-op. The custody ledger (`asset_movements`) was unwritable from the
 * one place custody physically changes hands.
 *
 * One decision per sheet, one thumb: Take or Return, whichever the unit's
 * current state actually allows. Offering both and failing on the FSM
 * would teach people to guess.
 */
export function CustodySheet({
  target,
  onClose,
  labels,
}: {
  target: CustodyTarget;
  onClose: () => void;
  labels: { take: string; ret: string; cancel: string; managerOnly: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Mirror the shared FSM's eligibility so the sheet only offers the move
  // that can succeed. `available` → take; `in_use`/`in_transit` → return.
  const canTake = target.state === "available";
  const canReturn = target.state === "in_use" || target.state === "in_transit";

  const move = (direction: "out" | "in") => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("assetId", target.id);
    fd.set("direction", direction);
    startTransition(async () => {
      const res = await moveAssetCustody(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <div className="sheet-body" style={{ padding: 4 }}>
      <div style={{ marginBottom: 10 }}>
        <div className="t" style={{ fontSize: 15 }}>
          {target.tag}
        </div>
        <div className="s">{target.status}</div>
      </div>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {!canTake && !canReturn && (
        <div className="hint" style={{ marginBottom: 10 }}>
          {labels.managerOnly}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {canTake && (
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
            onClick={() => move("out")}
          >
            <KIcon name="ArrowUpRight" size={16} /> {labels.take}
          </button>
        )}
        {canReturn && (
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
            onClick={() => move("in")}
          >
            <KIcon name="ArrowDownLeft" size={16} /> {labels.ret}
          </button>
        )}
        <button
          type="button"
          className="ps-btn ps-btn--secondary ps-btn--lg"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
