"use client";

import * as React from "react";
import { Upload, X, AlertCircle } from "lucide-react";

/**
 * ImportPanel — pick a file, parse it client-side via the caller's `parse`
 * prop, preview the resulting rows in a table, then confirm or cancel. NO
 * network: parsing and confirmation are entirely the caller's concern — on
 * confirm we hand back the parsed rows via `onImport`. Token-only colors;
 * controls carry ARIA + a `--p-focus` ring.
 *
 * `Row` is the caller's row shape; `columns` names which keys to render and
 * how to label them (defaults to the union of keys in the first preview row).
 */
export type ImportColumn<Row> = {
  key: keyof Row & string;
  label?: string;
  render?: (value: Row[keyof Row], row: Row) => React.ReactNode;
};

export type ImportPanelProps<Row extends Record<string, unknown>> = {
  /** Parse a selected file into preview rows. May be async. No network here. */
  parse: (file: File) => Row[] | Promise<Row[]>;
  /** Called with the parsed rows when the user confirms. */
  onImport: (rows: Row[]) => void;
  onCancel?: () => void;
  columns?: ImportColumn<Row>[];
  accept?: string;
  /** Cap the preview table to this many rows (parse still returns all). */
  previewLimit?: number;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
};

export function ImportPanel<Row extends Record<string, unknown>>({
  parse,
  onImport,
  onCancel,
  columns,
  accept,
  previewLimit = 50,
  title = "Import data",
  confirmLabel = "Import",
  cancelLabel = "Cancel",
  className = "",
}: ImportPanelProps<Row>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setFileName(null);
    setRows(null);
    setError(null);
    setParsing(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setError(null);
    setRows(null);
    setParsing(true);
    try {
      const parsed = await parse(file);
      setRows(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file.");
    } finally {
      setParsing(false);
    }
  };

  const resolvedColumns: ImportColumn<Row>[] = React.useMemo(() => {
    if (columns && columns.length) return columns;
    const first = rows?.[0];
    if (!first) return [];
    return (Object.keys(first) as (keyof Row & string)[]).map((key) => ({ key }));
  }, [columns, rows]);

  const previewRows = rows ? rows.slice(0, previewLimit) : [];

  return (
    <div className={`rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--p-text-1)]">{title}</h3>
        {fileName ? (
          <button
            type="button"
            onClick={reset}
            aria-label="Remove selected file"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--p-text-2)] transition-colors hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {!fileName ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ps-btn ps-btn--ghost ps-btn--sm inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
        >
          <Upload size={14} aria-hidden="true" />
          Choose file
        </button>
      ) : (
        <p className="text-xs text-[var(--p-text-2)]">
          <span className="font-medium text-[var(--p-text-1)]">{fileName}</span>
          {rows ? ` — ${rows.length} row${rows.length === 1 ? "" : "s"} parsed` : ""}
        </p>
      )}

      {parsing && (
        <p className="mt-3 text-xs text-[var(--p-text-2)]" aria-live="polite">
          Parsing&hellip;
        </p>
      )}

      {error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--p-danger)]" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-md border border-[var(--p-border)]">
          <table className="w-full text-start text-sm">
            <caption className="sr-only">Import preview</caption>
            <thead>
              <tr className="border-b border-[var(--p-border)] bg-[var(--p-surface-2)]">
                {resolvedColumns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className="px-3 py-2 text-start text-xs font-semibold text-[var(--p-text-2)]"
                  >
                    {c.label ?? c.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri} className="border-b border-[var(--p-border)] last:border-0">
                  {resolvedColumns.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-[var(--p-text-1)]">
                      {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > previewRows.length && (
            <p className="px-3 py-2 text-xs text-[var(--p-text-2)]">
              Showing {previewRows.length} of {rows.length} rows.
            </p>
          )}
        </div>
      )}

      {rows && rows.length === 0 && (
        <p className="mt-3 text-xs text-[var(--p-text-2)]">No rows found in this file.</p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            reset();
            onCancel?.();
          }}
          className="ps-btn ps-btn--ghost ps-btn--sm focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={!rows || rows.length === 0 || parsing}
          onClick={() => rows && onImport(rows)}
          className="ps-btn ps-btn--sm focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
