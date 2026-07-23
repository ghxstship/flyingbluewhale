/**
 * Route-matched streaming skeleton — the kiosk page resolves its device
 * registration server-side before first paint; show something instantly on
 * slow venue networks.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="detail" />;
}
