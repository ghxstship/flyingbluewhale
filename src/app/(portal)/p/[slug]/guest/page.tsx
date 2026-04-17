import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function GuestHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "guest")} title="Guest" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Guest portal" subtitle="Tickets, schedule, and logistics" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: `/p/${slug}/guest/tickets`, label: "Tickets", desc: "Buy · claim · transfer" },
              { href: `/p/${slug}/guest/schedule`, label: "Schedule", desc: "Program and set times" },
              { href: `/p/${slug}/guest/logistics`, label: "Logistics", desc: "Parking, entrances, rideshare" },
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
