import { ScanSurface, parseScanMode } from "../check-in/ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/scan — ALIAS of /m/check-in (kit 29 §C route policy, directive
 * 2026-07-17: no live surface is deleted; alias pairs render ONE shared
 * surface). Renders the same shared Scan surface as the canonical route —
 * the former standalone QuickScan capture log was a divergent duplicate.
 */
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const { mode } = await searchParams;
  return <ScanSurface initialMode={parseScanMode(mode)} />;
}
