import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export async function PortalSubpage({
  slug,
  persona,
  title,
  subtitle,
  children,
}: {
  slug: string;
  persona: "artist" | "vendor" | "client" | "sponsor" | "guest" | "crew";
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, persona)} title={persona.charAt(0).toUpperCase() + persona.slice(1)} />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title={title} subtitle={subtitle} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
