import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function ArtistHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "artist")} title="Artist" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Artist portal" subtitle="Submit riders, input lists, catering, travel, and schedule" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: `/p/${slug}/artist/advancing`, label: "Advancing", desc: "Technical rider · hospitality · stage plot · guest list" },
              { href: `/p/${slug}/artist/catering`, label: "Catering", desc: "Meals, dietary preferences, green room" },
              { href: `/p/${slug}/artist/venue`, label: "Venue", desc: "Load-in, power, dimensions" },
              { href: `/p/${slug}/artist/schedule`, label: "Schedule", desc: "Show day timing" },
              { href: `/p/${slug}/artist/travel`, label: "Travel", desc: "Flights, hotel, ground transport" },
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
