import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav, type PortalPersona } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Standard chrome for a portal leaf page: persona rail (desktop) +
 * mobile nav drawer + ModuleHeader with a default breadcrumb trail back
 * to the persona home. Accepts every one of the 15 portal sub-personas;
 * pass `breadcrumbs` to override the default trail (or `[]` to suppress).
 */
export async function PortalSubpage({
  slug,
  persona,
  title,
  subtitle,
  breadcrumbs,
  children,
}: {
  slug: string;
  persona: PortalPersona;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
}) {
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  const crumbs = breadcrumbs ?? [
    { label: project.name, href: `/p/${slug}` },
    {
      label: t(`p.shared.persona.${persona}`, undefined, persona.charAt(0).toUpperCase() + persona.slice(1)),
      href: `/p/${slug}/${persona}`,
    },
    { label: title },
  ];
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, persona)} />
      <div className="min-w-0 flex-1">
        <ModuleHeader eyebrow={project.name} title={title} subtitle={subtitle} breadcrumbs={crumbs} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
