"use client";

import { useMemo, useState, useTransition } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  COLUMN_TYPES,
  COLUMN_TYPE_LABELS,
  SHEET_STATE_LABELS,
  cellToInput,
  inputToCell,
  labelToKey,
  uniqueKey,
  type CellValue,
  type ColumnType,
  type SheetCells,
  type SheetColumn,
  type SheetRow,
  type SheetState,
} from "@/lib/sheets";
import { saveSheetAction } from "../actions";

type GridRow = { id: string; cells: SheetCells };

let tempCounter = 0;
function tempId(): string {
  tempCounter += 1;
  return `tmp_${Date.now()}_${tempCounter}`;
}

/**
 * Airtable-style editable grid. All edits happen in local React state; the
 * "Save" button serializes the full column schema + row set and posts it to
 * `saveSheetAction` (Zod-validated, RLS-scoped, bulk delete-then-insert).
 *
 * @tanstack/react-table (v8) drives the table structure; cells are controlled
 * inputs whose onChange patches local state.
 */
export function SheetGrid({
  sheetId,
  sheetState,
  initialColumns,
  initialRows,
  canEdit,
}: {
  sheetId: string;
  sheetState: SheetState;
  initialColumns: SheetColumn[];
  initialRows: SheetRow[];
  canEdit: boolean;
}) {
  const fmt = useFormatters();
  const [columns, setColumns] = useState<SheetColumn[]>(initialColumns);
  const [rows, setRows] = useState<GridRow[]>(
    initialRows.map((r) => ({ id: r.id, cells: { ...r.cells } })),
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ── cell + row + column mutators ──────────────────────────────────────
  function setCell(rowId: string, colKey: string, value: CellValue) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colKey]: value } } : r)));
    setDirty(true);
  }

  function addRow() {
    setRows((prev) => [...prev, { id: tempId(), cells: {} }]);
    setDirty(true);
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setDirty(true);
  }

  function addColumn() {
    const label = `Column ${columns.length + 1}`;
    const key = uniqueKey(
      labelToKey(label),
      columns.map((c) => c.key),
    );
    setColumns((prev) => [...prev, { key, label, type: "text" }]);
    setDirty(true);
  }

  function removeColumn(key: string) {
    setColumns((prev) => prev.filter((c) => c.key !== key));
    setDirty(true);
  }

  function renameColumn(key: string, label: string) {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, label } : c)));
    setDirty(true);
  }

  function retypeColumn(key: string, type: ColumnType) {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, type } : c)));
    setDirty(true);
  }

  // ── save ──────────────────────────────────────────────────────────────
  function save() {
    setError(null);
    const payload = {
      columns,
      rows: rows.map((r, i) => ({ position: i, cells: r.cells })),
    };
    startTransition(async () => {
      const res = await saveSheetAction(sheetId, JSON.stringify(payload));
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDirty(false);
      setSavedAt(fmt.time(new Date()));
    });
  }

  // ── table model ─────────────────────────────────────────────────────────
  const tableColumns = useMemo<ColumnDef<GridRow>[]>(() => {
    const dataCols: ColumnDef<GridRow>[] = columns.map((col) => ({
      id: col.key,
      header: () =>
        canEdit ? (
          <div className="flex flex-col gap-1">
            <input
              className="ps-input h-7 text-xs font-semibold"
              value={col.label}
              onChange={(e) => renameColumn(col.key, e.target.value)}
              aria-label={`Column ${col.label} label`}
            />
            <div className="flex items-center gap-1">
              <select
                className="ps-input h-7 flex-1 text-xs"
                value={col.type}
                onChange={(e) => retypeColumn(col.key, e.target.value as ColumnType)}
                aria-label={`Column ${col.label} type`}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {COLUMN_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="nav-item press-scale px-2 text-xs text-[var(--p-text-2)]"
                onClick={() => removeColumn(col.key)}
                aria-label={`Remove column ${col.label}`}
                title="Remove column"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold">{col.label}</span>
        ),
      cell: ({ row }) => {
        const value = row.original.cells[col.key] ?? null;
        if (!canEdit) {
          return <span className="text-xs">{cellToInput(value)}</span>;
        }
        if (col.type === "checkbox") {
          return (
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => setCell(row.original.id, col.key, e.target.checked)}
              aria-label={`${col.label} for row ${row.index + 1}`}
            />
          );
        }
        return (
          <input
            className="ps-input h-7 w-full text-xs"
            type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
            value={cellToInput(value)}
            onChange={(e) => setCell(row.original.id, col.key, inputToCell(e.target.value, col.type))}
            aria-label={`${col.label} for row ${row.index + 1}`}
          />
        );
      },
    }));

    if (canEdit) {
      dataCols.push({
        id: "__actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <button
            type="button"
            className="nav-item press-scale px-2 text-xs text-[var(--p-text-2)]"
            onClick={() => removeRow(row.original.id)}
            aria-label={`Remove row ${row.index + 1}`}
            title="Remove row"
          >
            ✕
          </button>
        ),
      });
    }
    return dataCols;
  }, [columns, canEdit]);

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const archived = sheetState === "archived";

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert kind="error">{error}</Alert>}
      {archived && (
        <Alert kind="warning">This sheet is {SHEET_STATE_LABELS[sheetState]}. Edits are still saved.</Alert>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={addColumn}>
            + Column
          </Button>
          <Button size="sm" variant="secondary" onClick={addRow}>
            + Row
          </Button>
          <div className="flex-1" />
          {savedAt && !dirty && <span className="text-xs text-[var(--p-text-2)]">Saved {savedAt}</span>}
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}

      {columns.length === 0 ? (
        <EmptyState
          title="No columns"
          description="Add a column to start building your grid."
          action={
            canEdit ? (
              <Button size="sm" onClick={addColumn}>
                + Column
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="ps-table w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="p-2 align-top">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length} className="p-6 text-center text-xs text-[var(--p-text-2)]">
                    No rows yet.{canEdit ? " Use “+ Row” to add one." : ""}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((r) => (
                  <tr key={r.id}>
                    {r.getVisibleCells().map((c) => (
                      <td key={c.id} className="p-1.5 align-middle">
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
