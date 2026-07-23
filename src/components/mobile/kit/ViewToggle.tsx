"use client";

import { KIcon } from "./icon";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * View-mode icon toggle that lives inside the control cluster. Ported from
 * the prototype `ViewToggle` / `VIEW_ICON`.
 */
export type ViewMode = "list" | "board" | "table" | "calendar" | "gallery";

export const VIEW_ICON: Record<ViewMode, string> = {
  list: "List",
  board: "Columns3",
  table: "Table2",
  calendar: "CalendarDays",
  gallery: "LayoutGrid",
};

/** Locale-resolved display labels for the view modes (kit chrome i18n). */
export function useViewModeLabels(): Record<ViewMode, string> {
  const t = useT();
  return {
    list: t("m.kit.viewMode.list", undefined, "List"),
    board: t("m.kit.viewMode.board", undefined, "Board"),
    table: t("m.kit.viewMode.table", undefined, "Table"),
    calendar: t("m.kit.viewMode.calendar", undefined, "Calendar"),
    gallery: t("m.kit.viewMode.gallery", undefined, "Gallery"),
  };
}

export type ViewToggleProps = {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  views: ViewMode[];
};

export function ViewToggle({ value, onChange, views }: ViewToggleProps) {
  const labels = useViewModeLabels();
  return (
    <div className="vtog">
      {views.map((v) => (
        <button
          key={v}
          type="button"
          className={value === v ? "on" : ""}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          title={labels[v]}
          aria-label={labels[v]}
        >
          <KIcon name={VIEW_ICON[v]} size={15} />
        </button>
      ))}
    </div>
  );
}
