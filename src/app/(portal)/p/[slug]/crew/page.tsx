import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function CrewHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "crew")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.crew.index.title", undefined, "Crew Portal")}
          subtitle={t("p.crew.index.subtitle", undefined, "Call sheet, time, advances")}
        />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                href: `/p/${slug}/crew/call-sheet`,
                label: t("p.crew.index.callSheet.label", undefined, "Call Sheet"),
                desc: t("p.crew.index.callSheet.desc", undefined, "Day-of info, parking, contacts"),
              },
              {
                href: `/p/${slug}/crew/time`,
                label: t("p.crew.index.time.label", undefined, "Time"),
                desc: t("p.crew.index.time.desc", undefined, "Submit hours worked"),
              },
              {
                href: `/p/${slug}/crew/advances`,
                label: t("p.crew.index.advances.label", undefined, "Advancing"),
                desc: t(
                  "p.crew.index.advances.desc",
                  undefined,
                  "Catalog items assigned to you: credentials, catering, radios, tools, uniforms, travel, lodging, vehicles",
                ),
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
