import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function VendorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "vendor")} title="Vendor" />
      <div className="flex-1">
        <ModuleHeader eyebrow={project.name} title="Vendor portal" subtitle="Quotes, POs, invoicing, credentials" />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: `/p/${slug}/vendor/submissions`, label: "Submissions", desc: "Quotes and vendor packages" },
              { href: `/p/${slug}/vendor/equipment-pull-list`, label: "Equipment pull list", desc: "Gear assignment" },
              { href: `/p/${slug}/vendor/purchase-orders`, label: "Purchase orders", desc: "POs issued to you" },
              { href: `/p/${slug}/vendor/invoices`, label: "Invoices", desc: "Submit invoice, track status" },
              { href: `/p/${slug}/vendor/credentials`, label: "Credentials", desc: "Upload COI, W-9, licenses" },
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
