import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function GuestHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "guest")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.guest.home.title", undefined, "Guest Portal")}
          subtitle={t("p.guest.home.subtitle", undefined, "Tickets, schedule, and logistics")}
        />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                href: `/p/${slug}/guest/tickets`,
                label: t("p.guest.home.tickets.label", undefined, "Tickets"),
                desc: t("p.guest.home.tickets.desc", undefined, "Your passes and entry codes"),
              },
              {
                href: `/p/${slug}/guest/schedule`,
                label: t("p.guest.home.schedule.label", undefined, "Schedule"),
                desc: t("p.guest.home.schedule.desc", undefined, "Program and set times"),
              },
              {
                href: `/p/${slug}/guest/logistics`,
                label: t("p.guest.home.logistics.label", undefined, "Logistics"),
                desc: t("p.guest.home.logistics.desc", undefined, "Parking, entrances, rideshare"),
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
