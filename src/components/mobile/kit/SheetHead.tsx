"use client";

import { KIcon } from "./icon";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Canonical drawer header — kit 31 `SheetHead`
 * (design_handoff_compvss_field/runtime/app.jsx:71). Every bottom sheet gets
 * an icon well + display title + explicit ✕ close control, so no sheet relies
 * on scrim-tap alone to dismiss (live-test resolution #8).
 */
export type SheetHeadProps = {
  icon?: string;
  title: string;
  sub?: string;
  /** Already-translated close label for the ✕ control (defaults to "Close"). */
  closeLabel?: string;
  onClose: () => void;
};

export function SheetHead({ icon, title, sub, closeLabel, onClose }: SheetHeadProps) {
  const t = useT();
  const close = closeLabel ?? t("m.kit.close", undefined, "Close");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px" }}>
      {icon && (
        <span className="form-ic">
          <KIcon name={icon} size={20} />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 18 }}>{title}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
      <button type="button" className="modal-x" onClick={onClose} aria-label={close}>
        <KIcon name="X" size={17} />
      </button>
    </div>
  );
}
