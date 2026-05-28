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
 * Promoter portal landing — EXECUTIVE-class dashboard for the co-pro
 * counterpart on a tour leg / one-off show. Cover band + curated
 * sections backed by the EXECUTIVE template (ADR-0004 portal collapse).
 */
export default async function PromoterHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const nav = portalNav(slug, "promoter");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "co-pro",
      title: "Co-Pro Splits",
      description: "Your share of the deal — fees, expenses, settlement basis.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(`/p/${slug}/promoter/co-pro`, "Splits", "Headline + walkout terms")}
          {tile(`/p/${slug}/promoter/settlements`, "Settlements", "Show-night reconciliation")}
        </div>
      ),
    },
    {
      key: "show-economy",
      title: "Show Economy",
      description: "Tour-level P&L and milestone tracking.",
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(`/p/${slug}/promoter/tour-pnl`, "Tour P&L", "Routing economics")}
          {tile(`/p/${slug}/promoter/marketing`, "Marketing Milestones", "Onsale, pre-sale, drops")}
        </div>
      ),
    },
    {
      key: "approvals",
      title: "Approvals",
      description: "Decisions still waiting on you.",
      body: tile(`/p/${slug}/promoter/approvals`, "Pending", "Review and sign"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={nav} />
      <div className="flex-1 p-6">
        <ExecutiveDashboard title="Promoter Portal" subtitle={project.name} sections={sections} />
      </div>
    </div>
  );
}
