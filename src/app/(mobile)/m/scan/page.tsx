import { ScanSurface, parseScanMode, parseScannerKind } from "../check-in/ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/scan — ALIAS of /m/check-in (kit 29 §C route policy, directive
 * 2026-07-17: no live surface is deleted; alias pairs render ONE shared
 * surface). Renders the same shared Scan surface as the canonical route —
 * the former standalone QuickScan capture log was a divergent duplicate.
 * Kit 31 adds the Scanner segment deep links (`?mode=scanner`,
 * `?kind=document|invoice|receipt`, `?expense=<id>`).
 */
export default async function ScanPage({
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
