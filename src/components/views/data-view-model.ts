// data-view-model — the shared column/row mapping layer behind the canonical
// collection surface (`views/DataView`, Option B ratified 2026-07-22).
//
// No "use client" directive on purpose: the same mapping runs
//   • server-side in `views/DataViewServer.tsx` (cells pre-rendered, values
//     derived, then handed across the RSC boundary as data), and
//   • client-side in `views/DataView.tsx` when a client page passes
//     DataTable-shaped ("rich") column defs directly.
//
// The `DataViewColumn` type is deliberately a structural superset of the
// legacy `Column<T>` from `@/components/DataTable`, so a DataTable call site
// migrates by changing the import + component name only (B0_PARITY.md §Recipe).
// The mapping logic is a corrected copy of DataTable's — corrected because
// DataTable's `mono` flag composed the WRONG mono face (`font-mono` = Space
// Mono, the eyebrow voice) where the v8.0 typography canon puts the DATA face
// (IBM Plex Mono, `--p-mono-data`) on code-like/tabular table content. That
// W2 root-cause fix is built in here so every migrated surface lands
// correct-by-default. DataTable itself is frozen and dies at B-final.

import type { ReactNode } from "react";
import type { InteractiveColumn, InteractiveRow, TotalFormatSpec } from "@/components/DataTableInteractive";
import type { RowActionItem } from "@/components/ui/RowActions";

export type { TotalFormatSpec };

/* ── Sanctioned cell-face classes (W2 root-cause, built right) ─────────────
 * The DATA face is IBM Plex Mono via the theme token `--p-mono-data`
 * (falling back to `--p-mono` only when the token layer is absent), never
 * the Tailwind `font-mono` shortcut (that resolves to Space Mono, the
 * eyebrow/ID voice). `num` is the `.ps-table` kit vocabulary: right-aligned
 * tabular figures in the data face (atlvs-product.css v7.0 table upgrades).
 * Keep these as full literal strings so Tailwind's scanner sees each token. */

/** IBM Plex data face only — compose with other utilities as needed. */
export const DATA_FACE_CLASS = "font-[family-name:var(--p-mono-data,var(--p-mono))]";
/** `mono: true` cells — code-like data (hashes, IDs, file paths). */
export const MONO_CELL_CLASS = "font-[family-name:var(--p-mono-data,var(--p-mono))] text-xs";
/** `tabular: true` cells — money / counts / percentages that must align. */
export const TABULAR_CELL_CLASS = "font-[family-name:var(--p-mono-data,var(--p-mono))] tabular-nums";
/** `numeric: true` cells — the `.ps-table .num` kit variant (right-aligned
 *  tabular figures in the data face; the header cell right-aligns too). */
export const NUMERIC_CELL_CLASS = "num";

/**
 * DataViewColumn — DataTable-shaped column definition (structural superset
 * of `Column<T>` in `@/components/DataTable`, plus `numeric`).
 */
export type DataViewColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Per-cell className applied to `<th>` and `<td>` (escape hatch — prefer
   *  the typed flags below). */
  className?: string;
  /** Header-only className. NOTE: only honored by the structure-preserving
   *  empty state today (parity with DataTable, which had the same gap). */
  headerClassName?: string;
  /** Enable header click-to-sort. Defaults to true (parity with DataTable). */
  sortable?: boolean;
  /** Per-column include-only filter (multi-select on distinct values). */
  filterable?: boolean;
  /** Default-hidden columns the user can re-enable from the column menu. */
  defaultHidden?: boolean;
  /** Surface this column as a Group-by option. */
  groupable?: boolean;
  /** Render cells in the DATA mono face (IBM Plex, `--p-mono-data`) — for
   *  genuinely code-like data (hashes, IDs, file paths). Not for emails,
   *  names, free text. */
  mono?: boolean;
  /** Tabular figures in the data face so numeric columns align vertically.
   *  Use for money / counts / percentages that keep their left alignment. */
  tabular?: boolean;
  /** The `.ps-table .num` kit variant: right-aligned tabular figures in the
   *  data face, header right-aligned too. Prefer this for money columns. */
  numeric?: boolean;
  /** Returns the underlying scalar for sort / filter / CSV export. Without
   *  it the mapping falls back to the plain-text content of the rendered
   *  cell. */
  accessor?: (row: T) => string | number | null | undefined | unknown;
  /** Footer aggregate over the (filtered) rows. */
  total?: "sum" | "avg" | "min" | "max" | "count";
  /** Formatter for the footer cell. Server call sites MUST use the
   *  serializable `TotalFormatSpec` form (e.g. `{ style: "money" }`) —
   *  plain closures cannot cross the RSC boundary. Client components may
   *  pass a function. */
  totalFormat?: ((n: number) => string) | TotalFormatSpec;
  /** Double-click-to-edit (requires `accessor` + the table's `onCellEdit`). */
  editable?: boolean;
};

/** Spotlight rule — same shape as DataTable's (SmartSuite Spotlight). */
export type SpotlightRule<T> = {
  when: (row: T) => boolean;
  tone: "info" | "warn" | "error" | "success" | "neutral";
  scope?: "row" | "cell";
  cell?: string;
};

/** Coerce an accessor result to the scalar the interactive table sorts on. */
export function coerceScalar(v: unknown): string | number | null {
  if (v == null || typeof v === "boolean") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  try {
    return String(v);
  } catch {
    return null;
  }
}

/** Strip the plain text out of a rendered cell (accessor fallback). */
export function extractText(node: ReactNode): string | number | null {
  if (node == null || typeof node === "boolean") return null;
  if (typeof node === "number") return node;
  if (typeof node === "string") return node;
  if (Array.isArray(node))
    return node
      .map(extractText)
      .filter((v) => v != null)
      .join(" ");
  const obj = node as unknown as { props?: { children?: ReactNode } };
  if (obj && typeof obj === "object" && obj.props && "children" in obj.props) {
    return extractText(obj.props.children);
  }
  return null;
}

/** Compose the cell className from the explicit prop + the typed flags. */
export function composeCellClassName<T>(c: DataViewColumn<T>): string | undefined {
  const parts = [c.className].filter(Boolean) as string[];
  if (c.mono) parts.push(MONO_CELL_CLASS);
  if (c.tabular) parts.push(TABULAR_CELL_CLASS);
  if (c.numeric) parts.push(NUMERIC_CELL_CLASS);
  return parts.length ? parts.join(" ") : undefined;
}

/** Map rich columns → the interactive table's column shape. */
export function toInteractiveColumns<T>(columns: readonly DataViewColumn<T>[]): InteractiveColumn[] {
  return columns.map((c) => ({
    key: c.key,
    header: c.header,
    className: composeCellClassName(c),
    // Sort defaults on — the mapping falls back to text-stripped cell
    // content when accessor is omitted (parity with DataTable).
    sortable: c.sortable ?? true,
    filterable: c.filterable,
    defaultHidden: c.defaultHidden,
    groupable: c.groupable,
    total: c.total,
    totalFormat: c.totalFormat,
    editable: c.editable,
  }));
}

export type RowMappingOptions<T> = {
  rowHref?: (row: T) => string | undefined;
  rowActions?: (row: T) => RowActionItem[] | null | undefined;
  rowClassName?: (row: T) => string | undefined;
  spotlight?: SpotlightRule<T>[];
};

/** Map one domain row → the interactive table's row shape (cells rendered,
 *  values derived, spotlight collapsed). */
export function toInteractiveRow<T extends { id: string }>(
  row: T,
  columns: readonly DataViewColumn<T>[],
  opts: RowMappingOptions<T> = {},
): InteractiveRow {
  const cells = columns.map((c) => c.render(row));
  const values = columns.map((c, i) => (c.accessor ? coerceScalar(c.accessor(row)) : extractText(cells[i])));
  const actions = opts.rowActions?.(row) ?? undefined;

  // Spotlight — collapse matching rules into a row-level className and an
  // optional per-cell className map. Later rules win for their scope.
  let rowSpotClass: string | undefined;
  let cellClassNames: Record<string, string> | undefined;
  if (opts.spotlight && opts.spotlight.length) {
    for (const rule of opts.spotlight) {
      if (!rule.when(row)) continue;
      const toneClass = `data-spotlight-${rule.tone}`;
      if (rule.scope === "cell" && rule.cell) {
        cellClassNames = { ...(cellClassNames ?? {}), [rule.cell]: toneClass };
      } else {
        rowSpotClass = toneClass;
      }
    }
  }

  const explicit = opts.rowClassName?.(row);
  const className = [explicit, rowSpotClass].filter(Boolean).join(" ") || undefined;

  return {
    id: row.id,
    href: opts.rowHref?.(row),
    cells,
    values,
    actions: actions && actions.length ? actions : undefined,
    className,
    cellClassNames,
  };
}

/** Runtime discriminator — rich (DataTable-shaped) columns carry `render`. */
export function isRichColumns<T>(
  columns: readonly InteractiveColumn[] | readonly DataViewColumn<T>[],
): columns is readonly DataViewColumn<T>[] {
  return columns.length > 0 && typeof (columns[0] as DataViewColumn<T>).render === "function";
}
