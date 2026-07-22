import { TimeOffRequestForm } from "@/components/workforce/TimeOffRequestForm";

/**
 * GVTEWAY crew · Request time off (ADR-0008 Amendment 4).
 *
 * Portal-native. This used to deep-link to `/m/time-off/new`, which put the
 * read on desktop and the write in a PWA — the friction the ADR exists to
 * remove. Filing time off is a form: no geofence, no offline requirement, so
 * under the capability rule it belongs in both shells.
 */
export const dynamic = "force-dynamic";

export default async function CrewTimeOffNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/p/${slug}/crew/time-off`;

  return (
    <div className="page-content">
      <div className="eyebrow eyebrow-accent">Crew</div>
      <h1 className="mt-1">Request Time Off</h1>
      <div className="mt-6 max-w-2xl">
        <TimeOffRequestForm revalidate={base} backHref={base} />
      </div>
    </div>
  );
}
