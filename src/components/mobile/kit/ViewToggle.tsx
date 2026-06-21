"use client";

import { KIcon } from "./icon";

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

export type ViewToggleProps = {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  views: ViewMode[];
};

export function ViewToggle({ value, onChange, views }: ViewToggleProps) {
  return (
    <div className="vtog">
      {views.map((v) => (
        <button
          key={v}
          type="button"
          className={value === v ? "on" : ""}
          onClick={() => onChange(v)}
          title={v[0]!.toUpperCase() + v.slice(1)}
          aria-label={v}
        >
          <KIcon name={VIEW_ICON[v]} size={15} />
        </button>
      ))}
    </div>
  );
}
