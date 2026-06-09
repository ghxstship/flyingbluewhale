import "server-only";

/**
 * CSV strategy — Opportunity #8.
 *
 * Given rows + columns, emit RFC-4180-conforming CSV bytes. Strings are
 * quoted only when they contain the delimiter, a quote, or a newline —
 * matches the shape produced by Excel, Numbers, and Google Sheets.
 */

export type CsvColumn = {
  key: string;
  header: string;
};

export function rowsToCsv(rows: Array<Record<string, unknown>>, columns: CsvColumn[]): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((r) => columns.map((c) => escapeCell(r[c.key])).join(","));
  // Trailing CRLF per RFC 4180. Excel prefers it, and it's what `csvOk.test`
  // encoders emit.
  return [headerLine, ...lines].join("\r\n") + "\r\n";
}

/**
 * Neutralize spreadsheet formula injection: a user-entered cell beginning
 * with = + - @ (or tab/CR) executes as a formula when the export is opened
 * in Excel/Sheets. Prefix with a single quote — the standard mitigation;
 * spreadsheet apps render the value, not the apostrophe.
 */
export function neutralizeFormula(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const raw = v instanceof Date ? v.toISOString() : String(v);
  const s = typeof v === "number" || typeof v === "boolean" || v instanceof Date ? raw : neutralizeFormula(raw);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
