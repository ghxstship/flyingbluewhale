"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KIcon, Sheet } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { moveAssetCustody } from "../inventory/actions";

/**
 * Asset quick-look on scan match — kit 32 Drawer System (v2.8) candidate.
 *
 * The Asset segment's match card opens a CONTEXT drawer: identify → act in
 * under ten seconds, full record one tap further. Check Out / Check In ride
 * `moveAssetCustody` — the same shared-FSM custody path (`asset_movements`
 * ledger + audit) the Inventory surface writes, so a gate scan and an
 * inventory tap are the same mutation. The custody band (manager+ or an
 * `asset:custody` grant) is enforced server-side; callers below the band see
 * the read-only identification with an honest hint instead of buttons that
 * would bounce.
 *
 * NOTE: `checkin_my_assignment` (kit 31 #25) is the ASSIGNMENT-domain return
 * path — it applies when a party returns their own issued gear, keyed by
 * assignment id. A scanned `assets.asset_tag` resolves to the physical-asset
 * store, where custody moves are the sanctioned write; entitlement codes on
 * the Access segment already ride the assignment resolver.
 */
export type ScannedAsset = {
  assetId: string;
  displayName: string | null;
  assetTag: string | null;
  state: string | null;
};

export function AssetQuickLook({
  asset,
  canMoveCustody,
  onClose,
}: {
  asset: ScannedAsset;
  canMoveCustody: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canTake = asset.state === "available";
  const canReturn = asset.state === "in_use" || asset.state === "in_transit";

  const move = (direction: "out" | "in") => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("assetId", asset.assetId);
    fd.set("direction", direction);
    startTransition(async () => {
      const res = await moveAssetCustody(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      toast.success(
        direction === "out"
          ? t("m.checkin.assetLook.checkedOut", undefined, "Checked Out")
          : t("m.checkin.assetLook.checkedIn", undefined, "Checked In"),
        { description: asset.displayName ?? asset.assetTag ?? undefined },
      );
      router.refresh();
      onClose();
    });
  };

  const stateLabel = asset.state
    ? asset.state.replace(/_/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    : t("m.checkin.assetLook.unknownState", undefined, "Unknown");

  return (
    <Sheet
      icon="Package"
      title={asset.displayName ?? asset.assetTag ?? t("m.checkin.assetLook.title", undefined, "Asset")}
      sub={`${asset.assetTag ?? t("m.checkin.assetLook.noTag", undefined, "No Tag")} · ${stateLabel}`}
      closeLabel={t("m.checkin.assetLook.close", undefined, "Close")}
      onClose={onClose}
    >
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {canMoveCustody ? (
        <div style={{ display: "flex", gap: 10 }}>
          {canTake && (
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={pending}
              onClick={() => move("out")}
            >
              <KIcon name="PackageOpen" size={15} />{" "}
              {pending
                ? t("m.checkin.assetLook.moving", undefined, "Saving…")
                : t("m.checkin.assetLook.checkOut", undefined, "Check Out")}
            </button>
          )}
          {canReturn && (
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={pending}
              onClick={() => move("in")}
            >
              <KIcon name="PackageCheck" size={15} />{" "}
              {pending
                ? t("m.checkin.assetLook.moving", undefined, "Saving…")
                : t("m.checkin.assetLook.checkIn", undefined, "Check In")}
            </button>
          )}
          {!canTake && !canReturn && (
            <p className="hint" style={{ margin: 0 }}>
              {t(
                "m.checkin.assetLook.noMove",
                undefined,
                "This asset is not in a custody state that can move from here.",
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="hint" style={{ margin: 0 }}>
          {t(
            "m.checkin.assetLook.bandHint",
            undefined,
            "Custody moves need the manager band or an asset custody grant.",
          )}
        </p>
      )}

      <Link href="/m/inventory" className="viewall" onClick={onClose} style={{ marginTop: 10 }}>
        {t("m.checkin.assetLook.fullCard", undefined, "Open Full Card")} <KIcon name="ArrowRight" size={15} />
      </Link>
    </Sheet>
  );
}
