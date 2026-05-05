/**
 * Types for the first-class saved-view system (Phase 3.1 of the SmartSuite
 * parity roadmap). Promotes the per-user `user_preferences.table_views`
 * JSON blob into a named, sharable, role-scoped `view_configs` table.
 *
 * Once views are addressable rows, every alt view-type renderer (Kanban,
 * Calendar, Timeline, Map, Chart, Gantt) becomes a drop-in alternative
 * selected by the saved view's `type`. The `viewConfig` slot inside
 * `SavedView` carries view-type-specific options (kanban swimlane field,
 * calendar date field, chart axes, etc.) so a single row covers them all.
 *
 * Per [SmartSuite Saved Views](https://help.smartsuite.com/en/articles/6493633-creating-a-saved-view).
 */

/** The nine first-class view types we plan to render. Phase 3.1 only ships
 *  `grid`; the alt renderers land in P3.2-3.6 and read the same row's
 *  `type` to decide which component to mount. */
export type ViewType = "grid" | "kanban" | "calendar" | "timeline" | "chart" | "map" | "gantt" | "card" | "form";

/** Visibility / authorization scope of a saved view. */
export type ViewScope = "private" | "org" | "public";

/**
 * The persisted shape of a saved view's settings — the SavedView contract.
 *
 * Mirrors (and supersets) the inline `SavedView` type previously defined in
 * `DataTableInteractive.tsx`. Lifted here so the table-row + the runtime
 * client share a single type, and so the alt view renderers (Kanban,
 * Calendar, Timeline, Map, Chart) can pull view-type-specific config from
 * the `viewConfig` slot.
 */
export type SavedView = {
  /** Free-text search query. */
  query?: string;
  /** Multi-key sort. The first entry is the primary, subsequent entries
   *  are secondary keys (shift-click in the grid header). */
  sort?: Array<{ key: string; dir: "asc" | "desc" }>;
  /** Row density. */
  density?: "comfortable" | "compact";
  /** Column keys the user has hidden. */
  hidden?: string[];
  /** Column keys the user has pinned to the front. */
  pinned?: string[];
  /** Explicit column order (column keys). Items not present fall back to
   *  the column-array order, then pinned go to the front. */
  order?: string[];
  /** Per-column include-only filters: column key → array of allowed scalar
   *  values stringified. */
  filters?: Record<string, string[]>;
  /** When set, rows are grouped by this column key. */
  groupBy?: string;
  /** Group keys (stringified scalar values) the user has collapsed. */
  collapsed?: string[];
  /** Spotlight rules — Phase 1.2's runtime contract; persisted here for
   *  reuse across sessions. The `when` predicate is stored as a string
   *  expression (evaluated at runtime by the renderer); `tone` maps to
   *  the `data-spotlight-{tone}` class. */
  spotlight?: Array<{
    when: string;
    tone: "info" | "warn" | "error" | "success" | "neutral";
    scope?: "row" | "cell";
    cell?: string;
  }>;
  /** View-type-specific config — kanban swimlane field, calendar date
   *  field, chart axes, map pin colour rule, etc. Opaque to the grid;
   *  consumed by the alt renderers. */
  viewConfig?: Record<string, unknown>;
};

/**
 * A row from the `view_configs` table, normalized to camelCase for
 * client / server-helper consumption. The raw DB columns are snake_case;
 * `src/lib/db/view-configs.ts` does the mapping.
 */
export type ViewConfigRow = {
  id: string;
  orgId: string;
  tableId: string;
  type: ViewType;
  scope: ViewScope;
  name: string;
  description?: string | null;
  config: SavedView;
  isDefault: boolean;
  isLocked: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Convenience guards for narrowing scope in switch statements. */
export const VIEW_SCOPES: ReadonlyArray<ViewScope> = ["private", "org", "public"];
export const VIEW_TYPES: ReadonlyArray<ViewType> = [
  "grid",
  "kanban",
  "calendar",
  "timeline",
  "chart",
  "map",
  "gantt",
  "card",
  "form",
];

export function isViewScope(v: unknown): v is ViewScope {
  return typeof v === "string" && (VIEW_SCOPES as ReadonlyArray<string>).includes(v);
}

export function isViewType(v: unknown): v is ViewType {
  return typeof v === "string" && (VIEW_TYPES as ReadonlyArray<string>).includes(v);
}

/**
 * Group label for the saved-view dropdown — translates a scope into the
 * UI heading the selector renders ("My Views" / "Shared" / "Public").
 */
export function scopeLabel(scope: ViewScope): string {
  switch (scope) {
    case "private":
      return "My Views";
    case "org":
      return "Shared";
    case "public":
      return "Public";
  }
}
