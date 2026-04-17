import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

const PERSONAS = [
  { key: "artist", label: "Artist", desc: "Riders, advancing, schedule, travel" },
  { key: "vendor", label: "Vendor", desc: "Submissions, POs, invoices, credentials" },
  { key: "client", label: "Client", desc: "Proposals, deliverables, invoices, files" },
  { key: "sponsor", label: "Sponsor", desc: "Activations, brand assets, reporting" },
  { key: "guest", label: "Guest", desc: "Tickets, schedule, logistics" },
  { key: "crew", label: "Crew", desc: "Call sheet, time, advances" },
];

export default async function PortalGateway({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let projectName = slug;
  if (hasSupabase) {
    const project = await projectIdFromSlug(slug);
    if (!project) notFound();
    projectName = project.name;
  }

  return (
    <div className="min-h-screen">
      <ModuleHeader title={projectName} subtitle={`Choose how you're collaborating on /${slug}`} />
      <div className="page-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => (
            <Link key={p.key} href={`/p/${slug}/${p.key}`} className="card p-6">
              <div className="text-label text-[var(--brand-color)]">{p.label}</div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{p.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
