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
  const lines = rows.map((r) =>
    columns.map((c) => escapeCell(r[c.key])).join(","),
  );
  // Trailing CRLF per RFC 4180. Excel prefers it, and it's what `csvOk.test`
  // encoders emit.
  return [headerLine, ...lines].join("\r\n") + "\r\n";
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
