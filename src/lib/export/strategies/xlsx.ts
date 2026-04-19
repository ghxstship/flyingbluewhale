import "server-only";

import ExcelJS from "exceljs";

/**
 * XLSX strategy — Opportunity #8 (part B).
 *
 * Emits an Excel workbook from the same row + column shape the CSV
 * strategy consumes. A small cover sheet carries the producer name +
 * row count + export timestamp so the XLSX is self-describing when
 * detached from the API context.
 */

export async function rowsToXlsxBuffer(args: {
  sheetName: string;
  orgName: string;
  rows: Array<Record<string, unknown>>;
  columns: Array<{ key: string; header: string }>;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "flyingbluewhale";
  wb.created = new Date();

  const coverSheet = wb.addWorksheet("Cover");
  coverSheet.columns = [
    { header: "Field", key: "field", width: 20 },
    { header: "Value", key: "value", width: 60 },
  ];
  coverSheet.addRows([
    { field: "Producer", value: args.orgName },
    { field: "Sheet", value: args.sheetName },
    { field: "Exported at", value: new Date().toISOString() },
    { field: "Row count", value: args.rows.length },
  ]);

  const data = wb.addWorksheet(args.sheetName);
  data.columns = args.columns.map((c) => ({ header: c.header, key: c.key, width: Math.max(c.header.length + 2, 16) }));
  data.addRows(args.rows);
  // Freeze header row.
  data.views = [{ state: "frozen", ySplit: 1 }];

  // exceljs returns Uint8Array; coerce to Buffer for our upload helper.
  const arr = await wb.xlsx.writeBuffer();
  return Buffer.from(arr as ArrayBuffer);
}
