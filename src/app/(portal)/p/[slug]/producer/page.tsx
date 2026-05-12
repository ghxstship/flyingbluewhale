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
 * Producer portal landing — EXECUTIVE-class dashboard for the external
 * production lead (when FLYTEHAUS is the platform under their direction).
 * Strategy + approvals + risk view, no operational detail.
 */
export default async function ProducerHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const nav = portalNav(slug, "producer");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "portfolio",
      title: "Portfolio",
      description: "Projects you own, by stage.",
      body: tile(`/p/${slug}/producer/portfolio`, "All projects", "Project cards by phase"),
    },
    {
      key: "pnl",
      title: "P&L",
      description: "Roll-up across your projects.",
      body: tile(`/p/${slug}/producer/pnl`, "Producer P&L", "Margin + variance"),
    },
    {
      key: "risk-readiness",
      title: "Risk + Readiness",
      description: "Open risks and gate-readiness for upcoming phases.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(`/p/${slug}/producer/risk`, "Risk", "Mitigation owners + due dates")}
          {tile(`/p/${slug}/producer/readiness`, "Readiness", "Phase-gate checklists")}
        </div>
      ),
    },
    {
      key: "approvals-reviews",
      title: "Approvals & Reviews",
      description: "Decisions and post-mortems.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(`/p/${slug}/producer/approvals`, "Approvals", "Pending decisions")}
          {tile(`/p/${slug}/producer/reviews`, "Reviews", "Show debriefs")}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={nav} title="Producer" />
      <div className="flex-1 p-6">
        <ExecutiveDashboard title="Producer Portal" subtitle={project.name} sections={sections} />
      </div>
    </div>
  );
}
