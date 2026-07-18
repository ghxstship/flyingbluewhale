import { ScanSurface, parseScanMode, parseScannerKind } from "./ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/check-in — the CANONICAL route of the shared COMPVSS Scan surface
 * (kit 29 §C: `/m/scan` is an alias, `/m/inventory/scan` is the Asset
 * preset). Supports `?mode=access|asset|pos|inventory|scanner` deep links;
 * the kit 31 Scanner segment adds `?kind=document|invoice|receipt` and
 * `?expense=<id>` (code an existing uncoded expense). See `ScanSurface`.
 */
export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[]; kind?: string | string[]; expense?: string | string[] }>;
}) {
  const { mode, kind, expense } = await searchParams;
  const expenseId = Array.isArray(expense) ? expense[0] : expense;
  return (
    <ScanSurface
      initialMode={expenseId ? "scanner" : parseScanMode(mode)}
      scannerKind={parseScannerKind(kind)}
      expenseId={expenseId}
    />
  );
}
