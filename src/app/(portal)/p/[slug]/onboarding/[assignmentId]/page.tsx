import { OnboardingSurface } from "@/components/workforce/OnboardingSurface";

/**
 * GVTEWAY · onboarding assignment (ADR-0008 Amendment 4).
 *
 * `/p/[slug]/tasks` surfaced the assignment and then linked out to
 * `/m/onboarding/[id]` to act on it — bouncing the reader out of the shell
 * that had just told them the task existed, into an app a vendor has no
 * entitlement to open. Ticking a step is a form, so it lives here too.
 *
 * Shared, not persona-scoped: the assignment is self-scoped by
 * `assignee_id`, and `/p/[slug]/tasks` is a Workspace surface every persona
 * carries.
 */
export const dynamic = "force-dynamic";

export default async function PortalOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string; assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <OnboardingSurface assignmentId={assignmentId} variant="portal" />;
}
