import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { ExecutiveDashboard } from "@/components/xpms/dashboards";
import type { DashboardSection } from "@/components/xpms/dashboards";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Producer portal landing — EXECUTIVE-class dashboard for the external
 * production lead (when ATLVS is the platform under their direction).
 * Strategy + approvals + risk view, no operational detail.
 */
export default async function ProducerHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();

  const nav = portalNav(slug, "producer");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--p-text-2)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "portfolio",
      title: t("p.producer.portfolio.title", undefined, "Portfolio"),
      description: t("p.producer.portfolio.description", undefined, "Projects you own, by stage."),
      body: tile(
        `/p/${slug}/producer/portfolio`,
        t("p.producer.portfolio.tile.label", undefined, "All projects"),
        t("p.producer.portfolio.tile.desc", undefined, "Project cards by phase"),
      ),
    },
    {
      key: "pnl",
      title: t("p.producer.pnl.title", undefined, "P&L"),
      description: t("p.producer.pnl.description", undefined, "Roll-up across your projects."),
      body: tile(
        `/p/${slug}/producer/pnl`,
        t("p.producer.pnl.tile.label", undefined, "Producer P&L"),
        t("p.producer.pnl.tile.desc", undefined, "Margin + variance"),
      ),
    },
    {
      key: "risk-readiness",
      title: t("p.producer.riskReadiness.title", undefined, "Risk + Readiness"),
      description: t(
        "p.producer.riskReadiness.description",
        undefined,
        "Open risks and gate-readiness for upcoming phases.",
      ),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(
            `/p/${slug}/producer/risk`,
            t("p.producer.risk.tile.label", undefined, "Risk"),
            t("p.producer.risk.tile.desc", undefined, "Mitigation owners + due dates"),
          )}
          {tile(
            `/p/${slug}/producer/readiness`,
            t("p.producer.readiness.tile.label", undefined, "Readiness"),
            t("p.producer.readiness.tile.desc", undefined, "Phase-gate checklists"),
          )}
        </div>
      ),
    },
    {
      key: "approvals-reviews",
      title: t("p.producer.approvalsReviews.title", undefined, "Approvals & Reviews"),
      description: t("p.producer.approvalsReviews.description", undefined, "Decisions and post-mortems."),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(
            `/p/${slug}/producer/approvals`,
            t("p.producer.approvals.tile.label", undefined, "Approvals"),
            t("p.producer.approvals.tile.desc", undefined, "Pending decisions"),
          )}
          {tile(
            `/p/${slug}/producer/reviews`,
            t("p.producer.reviews.tile.label", undefined, "Reviews"),
            t("p.producer.reviews.tile.desc", undefined, "Show debriefs"),
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={nav} />
      <div className="flex-1 p-6">
        <ExecutiveDashboard
          title={t("p.producer.title", undefined, "Producer Portal")}
          subtitle={project.name}
          sections={sections}
        />
      </div>
    </div>
  );
}
