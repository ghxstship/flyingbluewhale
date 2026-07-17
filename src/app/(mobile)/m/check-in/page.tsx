import { ScanSurface, parseScanMode } from "./ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/check-in — the CANONICAL route of the shared COMPVSS Scan surface
 * (kit 29 §C: `/m/scan` is an alias, `/m/inventory/scan` is the Asset
 * preset). Supports `?mode=access|asset|pos|inventory` deep links; see
 * `ScanSurface` for the surface itself.
 */
export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const { mode } = await searchParams;
  return <ScanSurface initialMode={parseScanMode(mode)} />;
}
