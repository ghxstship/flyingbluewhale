import { OnboardingSurface } from "@/components/workforce/OnboardingSurface";

/**
 * COMPVSS · onboarding assignment — thin wrapper over the shared
 * <OnboardingSurface>. The body moved into src/components/workforce/ in
 * ADR-0008 Amendment 4 so the portal could stop bouncing users here to tick
 * a checkbox; the render is unchanged.
 */
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  return <OnboardingSurface assignmentId={assignmentId} variant="mobile" />;
}
