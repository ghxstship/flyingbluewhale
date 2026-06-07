import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function SponsorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "sponsor")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.sponsor.home.title", undefined, "Sponsor Portal")}
          subtitle={t("p.sponsor.home.subtitle", undefined, "Activations, brand assets, reporting")}
        />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                href: `/p/${slug}/sponsor/activations`,
                label: t("p.sponsor.home.activations.label", undefined, "Activations"),
                desc: t("p.sponsor.home.activations.desc", undefined, "Track deliverables and site placements"),
              },
              {
                href: `/p/${slug}/sponsor/assets`,
                label: t("p.sponsor.home.assets.label", undefined, "Assets"),
                desc: t("p.sponsor.home.assets.desc", undefined, "Upload brand assets"),
              },
              {
                href: `/p/${slug}/sponsor/reporting`,
                label: t("p.sponsor.home.reporting.label", undefined, "Reporting"),
                desc: t("p.sponsor.home.reporting.desc", undefined, "Impressions and engagement"),
              },
            ].map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{tile.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
