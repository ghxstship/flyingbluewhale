import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function ClientHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "client")} title="Client" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Client portal" subtitle="Proposals, deliverables, invoices, and files" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: `/p/${slug}/client/proposals`, label: "Proposals", desc: "Review · approve · e-sign" },
              { href: `/p/${slug}/client/deliverables`, label: "Deliverables", desc: "Documents and assets" },
              { href: `/p/${slug}/client/invoices`, label: "Invoices", desc: "Pay invoices, download receipts" },
              { href: `/p/${slug}/client/messages`, label: "Messages", desc: "Direct thread with your team" },
              { href: `/p/${slug}/client/files`, label: "Files", desc: "Shared documents and assets" },
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
