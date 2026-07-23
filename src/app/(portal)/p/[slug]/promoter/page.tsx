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
 * Promoter portal landing — EXECUTIVE-class dashboard for the co-pro
 * counterpart on a tour leg / one-off show. Cover band + curated
 * sections backed by the EXECUTIVE template (ADR-0004 portal collapse).
 */
export default async function PromoterHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const { t } = await getRequestT();
  const nav = portalNav(slug, "promoter");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--p-text-2)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "co-pro",
      title: t("p.promoter.home.coPro.title", undefined, "Co-Pro Splits"),
      description: t(
        "p.promoter.home.coPro.description",
        undefined,
        "Your share of the deal: fees, expenses, settlement basis.",
      ),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(
            `/p/${slug}/promoter/co-pro`,
            t("p.promoter.home.coPro.splits.label", undefined, "Splits"),
            t("p.promoter.home.coPro.splits.desc", undefined, "Headline + walkout terms"),
          )}
          {tile(
            `/p/${slug}/promoter/settlements`,
            t("p.promoter.home.coPro.settlements.label", undefined, "Settlements"),
            t("p.promoter.home.coPro.settlements.desc", undefined, "Show-night reconciliation"),
          )}
        </div>
      ),
    },
    {
      key: "show-economy",
      title: t("p.promoter.home.showEconomy.title", undefined, "Show Economy"),
      description: t("p.promoter.home.showEconomy.description", undefined, "Tour-level P&L and milestone tracking."),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(
            `/p/${slug}/promoter/tour-pnl`,
            t("p.promoter.home.showEconomy.tourPnl.label", undefined, "Tour P&L"),
            t("p.promoter.home.showEconomy.tourPnl.desc", undefined, "Routing economics"),
          )}
          {tile(
            `/p/${slug}/promoter/marketing`,
            t("p.promoter.home.showEconomy.marketing.label", undefined, "Marketing Milestones"),
            t("p.promoter.home.showEconomy.marketing.desc", undefined, "Onsale, pre-sale, drops"),
          )}
        </div>
      ),
    },
    {
      key: "approvals",
      title: t("p.promoter.home.approvals.title", undefined, "Approvals"),
      description: t("p.promoter.home.approvals.description", undefined, "Decisions still waiting on you."),
      body: tile(
        `/p/${slug}/promoter/approvals`,
        t("p.promoter.home.approvals.pending.label", undefined, "Pending"),
        t("p.promoter.home.approvals.pending.desc", undefined, "Review and sign"),
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={nav} />
      <div className="flex-1 p-6">
        <ExecutiveDashboard
          title={t("p.promoter.home.title", undefined, "Promoter Portal")}
          subtitle={project.name}
          sections={sections}
        />
      </div>
    </div>
  );
}
