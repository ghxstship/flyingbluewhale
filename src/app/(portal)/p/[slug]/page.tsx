import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function PortalGateway({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();

  const PERSONAS = [
    {
      key: "artist",
      label: t("p.shared.gateway.artist.label", undefined, "Artist"),
      desc: t("p.shared.gateway.artist.desc", undefined, "Riders, advancing, schedule, travel"),
    },
    {
      key: "vendor",
      label: t("p.shared.gateway.vendor.label", undefined, "Vendor"),
      desc: t("p.shared.gateway.vendor.desc", undefined, "Submissions, POs, invoices, credentials"),
    },
    {
      key: "client",
      label: t("p.shared.gateway.client.label", undefined, "Client"),
      desc: t("p.shared.gateway.client.desc", undefined, "Proposals, deliverables, invoices, files"),
    },
    {
      key: "sponsor",
      label: t("p.shared.gateway.sponsor.label", undefined, "Sponsor"),
      desc: t("p.shared.gateway.sponsor.desc", undefined, "Activations, brand assets, reporting"),
    },
    {
      key: "guest",
      label: t("p.shared.gateway.guest.label", undefined, "Guest"),
      desc: t("p.shared.gateway.guest.desc", undefined, "Tickets, schedule, logistics"),
    },
    {
      key: "crew",
      label: t("p.shared.gateway.crew.label", undefined, "Crew"),
      desc: t("p.shared.gateway.crew.desc", undefined, "Call sheet, time, advances"),
    },
  ];

  let projectName = slug;
  if (hasSupabase) {
    const project = await projectIdFromSlug(slug);
    if (!project) notFound();
    projectName = project.name;
  }

  return (
    <div className="min-h-screen">
      <ModuleHeader
        title={projectName}
        subtitle={t("p.shared.gateway.subtitle", { slug }, `Choose how you're collaborating on /${slug}`)}
      />
      <div className="page-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona) => (
            <Link key={persona.key} href={`/p/${slug}/${persona.key}`} className="card p-6">
              <div className="text-label text-[var(--brand-color)]">{persona.label}</div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{persona.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
