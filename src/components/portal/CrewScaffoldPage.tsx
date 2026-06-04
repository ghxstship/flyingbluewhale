import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { urlFor } from "@/lib/urls";

/**
 * Shared scaffold for crew portal Connecteam-parity surfaces
 * (ADR-0008 Move 2). Renders a ModuleHeader + the surface's intent +
 * a deep-link to the equivalent `/m/<surface>` page where the rich UI
 * lives until ADR-0008 Move 1 (shared connecteam component extraction)
 * lifts the rendering pattern into a portal-shaped wrapper.
 *
 * Honest scaffolding — these pages render real content (description +
 * working cross-shell link), they are not redirect-only stubs.
 */
export function CrewScaffoldPage({
  title,
  subtitle,
  mobilePath,
  mobileLabel,
}: {
  title: string;
  subtitle: string;
  mobilePath: string;
  mobileLabel: string;
}) {
  return (
    <>
      <ModuleHeader eyebrow="Crew" title={title} subtitle={subtitle} />
      <div className="page-content space-y-3">
        <div className="surface p-4 text-sm">
          <p className="text-[var(--text-secondary)]">
            This surface is part of the ADR-0008 portal crew persona depth backfill. The full feature experience (with
            realtime updates, write actions, and field-optimized layouts) currently lives in COMPVSS. The portal-shaped
            wrapper lands when shared Connecteam components extract from `/m/*` per ADR-0008 Move 1.
          </p>
          <Link
            href={urlFor("mobile", mobilePath)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)] underline"
          >
            {mobileLabel} →
          </Link>
        </div>
      </div>
    </>
  );
}
