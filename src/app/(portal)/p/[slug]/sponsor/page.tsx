import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function SponsorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "sponsor")} title="Sponsor" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Sponsor portal" subtitle="Activations, brand assets, reporting" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: `/p/${slug}/sponsor/activations`, label: "Activations", desc: "Track deliverables and site placements" },
              { href: `/p/${slug}/sponsor/assets`, label: "Assets", desc: "Upload brand assets" },
              { href: `/p/${slug}/sponsor/reporting`, label: "Reporting", desc: "Impressions and engagement" },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
