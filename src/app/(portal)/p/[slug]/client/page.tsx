import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ClientHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "client")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.client.home.title", undefined, "Client Portal")}
          subtitle={t("p.client.home.subtitle", undefined, "Proposals, deliverables, invoices, and files")}
        />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: `/p/${slug}/client/proposals`,
                label: t("p.client.home.tiles.proposals.label", undefined, "Proposals"),
                desc: t("p.client.home.tiles.proposals.desc", undefined, "Review · approve · e-sign"),
              },
              {
                href: `/p/${slug}/client/deliverables`,
                label: t("p.client.home.tiles.deliverables.label", undefined, "Deliverables"),
                desc: t("p.client.home.tiles.deliverables.desc", undefined, "Documents and assets"),
              },
              {
                href: `/p/${slug}/client/invoices`,
                label: t("p.client.home.tiles.invoices.label", undefined, "Invoices"),
                desc: t("p.client.home.tiles.invoices.desc", undefined, "Pay invoices, download receipts"),
              },
              {
                href: `/p/${slug}/client/messages`,
                label: t("p.client.home.tiles.messages.label", undefined, "Messages"),
                desc: t("p.client.home.tiles.messages.desc", undefined, "Direct thread with your team"),
              },
              {
                href: `/p/${slug}/client/files`,
                label: t("p.client.home.tiles.files.label", undefined, "Files"),
                desc: t("p.client.home.tiles.files.desc", undefined, "Shared documents and assets"),
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
