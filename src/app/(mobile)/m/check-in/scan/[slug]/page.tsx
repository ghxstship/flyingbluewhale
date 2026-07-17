import { ScanSurface } from "../../ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/check-in/scan/[slug] — the shared Scan surface scoped to a gate / zone
 * slug. The slug is threaded through as gate context; scans submit through
 * the queueable /api/v1/scan endpoint (offline-safe).
 */
export default async function GateScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ScanSurface gateSlug={slug} />;
}
