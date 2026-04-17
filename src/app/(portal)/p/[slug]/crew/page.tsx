import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function CrewHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "crew")} title="Crew" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Crew portal" subtitle="Call sheet, time, advances" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: `/p/${slug}/crew/call-sheet`, label: "Call sheet", desc: "Day-of info, parking, contacts" },
              { href: `/p/${slug}/crew/time`, label: "Time", desc: "Submit hours worked" },
              { href: `/p/${slug}/crew/advances`, label: "Advances", desc: "Request per-diem or advance" },
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
