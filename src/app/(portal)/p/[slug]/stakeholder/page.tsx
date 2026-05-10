import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { ExecutiveDashboard } from "@/components/xpms/dashboards";
import type { DashboardSection } from "@/components/xpms/dashboards";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

/**
 * Stakeholder portal landing — EXECUTIVE-class dashboard for board /
 * principal / investor observers. Read-mostly, portfolio + governance
 * + audit. No operational detail.
 */
export default async function StakeholderHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const nav = portalNav(slug, "stakeholder");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "portfolio-pnl",
      title: "Portfolio & P&L",
      description: "Where the org's capital is committed and how it's performing.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(`/p/${slug}/stakeholder/portfolio`, "Portfolio", "Active projects + stages")}
          {tile(`/p/${slug}/stakeholder/pnl`, "P&L", "Roll-up across portfolio")}
        </div>
      ),
    },
    {
      key: "governance",
      title: "Governance",
      description: "Committees, policies, and approval gates.",
      body: tile(`/p/${slug}/stakeholder/governance`, "Committees", "Charters + cadence"),
    },
    {
      key: "esg",
      title: "Sustainability",
      description: "ESG reporting + sustainability posture.",
      body: tile(`/p/${slug}/stakeholder/sustainability`, "ESG", "Carbon + community impact"),
    },
    {
      key: "audit",
      title: "Audit Trail",
      description: "Every privileged action, time-stamped.",
      body: tile(`/p/${slug}/stakeholder/audit`, "Audit Log", "Read-only ledger"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={nav} title="Stakeholder" />
      <div className="flex-1 p-6">
        <ExecutiveDashboard title="Stakeholder Portal" subtitle={project.name} sections={sections} />
      </div>
    </div>
  );
}
