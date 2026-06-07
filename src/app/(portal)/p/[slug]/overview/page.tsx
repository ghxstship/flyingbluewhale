import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function PortalOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("p.overview.title", undefined, "Project Overview")}
        subtitle={t("p.overview.subtitle", undefined, "Pick your portal to continue")}
      />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["artist", "vendor", "client", "sponsor", "guest", "crew"].map((persona) => (
            <Link key={persona} href={`/p/${slug}/${persona}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{toTitle(persona)}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("p.overview.openPortal", { persona: toTitle(persona) }, `Open ${toTitle(persona)} Portal →`)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
