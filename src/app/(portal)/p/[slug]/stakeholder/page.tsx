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
 * Stakeholder portal landing — EXECUTIVE-class dashboard for board /
 * principal / investor observers. Read-mostly, portfolio + governance
 * + audit. No operational detail.
 */
export default async function StakeholderHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const { t } = await getRequestT();
  const nav = portalNav(slug, "stakeholder");
  const tile = (href: string, label: string, desc: string) => (
    <Link key={href} href={href} className="surface hover-lift block p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-[var(--p-text-2)]">{desc}</div>
    </Link>
  );

  const sections: DashboardSection[] = [
    {
      key: "portfolio-pnl",
      title: t("p.stakeholder.home.portfolioPnl.title", undefined, "Portfolio & P&L"),
      description: t(
        "p.stakeholder.home.portfolioPnl.description",
        undefined,
        "Where the org's capital is committed and how it's performing.",
      ),
      body: (
        <div className="grid gap-2 sm:grid-cols-2">
          {tile(
            `/p/${slug}/stakeholder/portfolio`,
            t("p.stakeholder.home.portfolio.label", undefined, "Portfolio"),
            t("p.stakeholder.home.portfolio.desc", undefined, "Active projects + stages"),
          )}
          {tile(
            `/p/${slug}/stakeholder/pnl`,
            t("p.stakeholder.home.pnl.label", undefined, "P&L"),
            t("p.stakeholder.home.pnl.desc", undefined, "Roll-up across portfolio"),
          )}
        </div>
      ),
    },
    {
      key: "governance",
      title: t("p.stakeholder.home.governance.title", undefined, "Governance"),
      description: t(
        "p.stakeholder.home.governance.description",
        undefined,
        "Committees, policies, and approval gates.",
      ),
      body: tile(
        `/p/${slug}/stakeholder/governance`,
        t("p.stakeholder.home.committees.label", undefined, "Committees"),
        t("p.stakeholder.home.committees.desc", undefined, "Charters + cadence"),
      ),
    },
    {
      key: "esg",
      title: t("p.stakeholder.home.esg.title", undefined, "Sustainability"),
      description: t("p.stakeholder.home.esg.description", undefined, "ESG reporting + sustainability posture."),
      body: tile(
        `/p/${slug}/stakeholder/sustainability`,
        t("p.stakeholder.home.esg.label", undefined, "ESG"),
        t("p.stakeholder.home.esg.desc", undefined, "Carbon + community impact"),
      ),
    },
    {
      key: "audit",
      title: t("p.stakeholder.home.audit.title", undefined, "Audit Trail"),
      description: t("p.stakeholder.home.audit.description", undefined, "Every privileged action, time-stamped."),
      body: tile(
        `/p/${slug}/stakeholder/audit`,
        t("p.stakeholder.home.auditLog.label", undefined, "Audit Log"),
        t("p.stakeholder.home.auditLog.desc", undefined, "Read-only ledger"),
      ),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={nav} />
      <div className="flex-1 p-6">
        <ExecutiveDashboard
          title={t("p.stakeholder.home.title", undefined, "Stakeholder Portal")}
          subtitle={project.name}
          sections={sections}
        />
      </div>
    </div>
  );
}
