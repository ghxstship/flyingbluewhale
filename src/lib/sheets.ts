/**
 * Collaborate · Sheets (deferred item F3).
 *
 * Single helper file for the sheets + sheet_rows module (migration
 * PENDING_collaborate_sheets). Org-scoped Airtable-style editable grid.
 * Pattern matches `src/lib/goals.ts`: enum tuples `as const` → derived
 * types → label maps + small pure helpers + Zod schemas.
 *
 * This module is NON-server (no "use server", no "server-only") so both the
 * server actions file and the client grid island can import the shared
 * tuples/types/schemas from one place.
 *
 * Row shapes are hand-written until the typed Database is regenerated
 * post-apply; reads/writes go through the LooseSupabase cast meanwhile.
 */

import { z } from "zod";

// ============================================================
// Sheet lifecycle (cyclical operational → `sheet_state`)
// ============================================================
export const SHEET_STATES = ["active", "archived"] as const;
export type SheetState = (typeof SHEET_STATES)[number];

export const SHEET_STATE_LABELS: Record<SheetState, string> = {
  active: "Active",
  archived: "Archived",
};

// ============================================================
// Column types
// ============================================================
export const COLUMN_TYPES = ["text", "number", "date", "checkbox"] as const;
export type ColumnType = (typeof COLUMN_TYPES)[number];

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
};

// ============================================================
// Shapes
// ============================================================
export type SheetColumn = {
  key: string;
  label: string;
  type: ColumnType;
};

/** A cell value — kept loose; the column `type` governs interpretation. */
export type CellValue = string | number | boolean | null;

export type SheetCells = Record<string, CellValue>;

export type Sheet = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  columns: SheetColumn[];
  sheet_state: SheetState;
  created_at: string;
  updated_at: string;
};

export type SheetRow = {
  id: string;
  sheet_id: string;
  position: number;
  cells: SheetCells;
};

// ============================================================
// Zod schemas
// ============================================================

/** Column key: stable identifier used as the cell-map key. */
const columnKeySchema = z
  .string()
  .min(1, "Column key required")
  .max(60)
  .regex(/^[a-z0-9_]+$/i, "Letters, digits, underscores only");

export const sheetColumnSchema = z.object({
  key: columnKeySchema,
  label: z.string().min(1, "Column label required").max(120),
  type: z.enum(COLUMN_TYPES),
});

export const sheetColumnsSchema = z
  .array(sheetColumnSchema)
  .max(64, "Too many columns (max 64)")
  .superRefine((cols, ctx) => {
    const seen = new Set<string>();
    cols.forEach((c, i) => {
      if (seen.has(c.key)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate column key "${c.key}"`, path: [i, "key"] });
      }
      seen.add(c.key);
    });
  });

/** Cell value per column type — used when validating a bulk save. */
const cellValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const sheetRowSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  cells: z.record(z.string(), cellValueSchema),
});

/** Full bulk-save payload posted by the grid island. */
export const sheetSavePayloadSchema = z.object({
  columns: sheetColumnsSchema,
  rows: z.array(sheetRowSchema).max(5000, "Too many rows (max 5000)"),
});

export type SheetSavePayload = z.infer<typeof sheetSavePayloadSchema>;

// ============================================================
// Pure helpers
// ============================================================

/** Coerce a raw stored value into a display string for an input. */
export function cellToInput(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/** Coerce an input string back to the typed cell value per column type. */
export function inputToCell(raw: string, type: ColumnType): CellValue {
  const trimmed = raw.trim();
  if (type === "checkbox") return raw === "true" || raw === "on";
  if (trimmed === "") return null;
  if (type === "number") {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return raw;
}

/** Slugify a label into a safe column key. */
export function labelToKey(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "col";
}

/** Ensure a candidate key is unique against existing keys. */
export function uniqueKey(candidate: string, existing: readonly string[]): string {
  if (!existing.includes(candidate)) return candidate;
  let i = 2;
  while (existing.includes(`${candidate}_${i}`)) i += 1;
  return `${candidate}_${i}`;
}
