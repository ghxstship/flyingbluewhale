import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card } from "@/components/ui/Card";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Compliance hub (kit 20 Safety · Protect rail) — one front page over the
 * org's compliance surfaces: OSHA logs, briefings, chain of custody,
 * permits, inspections, and vendor COIs. Each tile reads its real store
 * directly; the hub keeps zero parallel records.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.complianceHub.eyebrow", undefined, "Safety · Protect")}
          title={t("console.complianceHub.title", undefined, "Compliance")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.complianceHub.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Cheap head-counts over the real stores.
  const [recordablesQ, inspectionsQ, coisQ, permitsQ] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("osha_recordable", true),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("compliance_documents").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("dim_permit").select("permit_id", { count: "exact", head: true }),
  ]);
  const recordables = recordablesQ.count ?? 0;
  const inspections = inspectionsQ.count ?? 0;
  const cois = coisQ.count ?? 0;
  const permits = permitsQ.count ?? 0;

  const surfaces = [
    {
      label: t("console.complianceHub.osha", undefined, "OSHA 300 Log"),
      href: "/studio/safety/osha",
      sub: t("console.complianceHub.osha.sub", undefined, "Recordable injuries and illness log"),
    },
    {
      label: t("console.complianceHub.permits", undefined, "Permits"),
      href: "/studio/compliance/permits",
      sub: t("console.complianceHub.permits.sub", undefined, "Permit register with AHJ and lead times"),
    },
    {
      label: t("console.complianceHub.briefings", undefined, "Briefings"),
      href: "/studio/safety/briefings",
      sub: t("console.complianceHub.briefings.sub", undefined, "Toolbox talks and sign-offs"),
    },
    {
      label: t("console.complianceHub.coc", undefined, "Chain Of Custody"),
      href: "/studio/compliance/coc",
      sub: t("console.complianceHub.coc.sub", undefined, "Evidence and custody transfers"),
    },
    {
      label: t("console.complianceHub.inspections", undefined, "Inspections"),
      href: "/studio/inspections",
      sub: t("console.complianceHub.inspections.sub", undefined, "Scheduled and spot checks"),
    },
    {
      label: t("console.complianceHub.cois", undefined, "Vendor COIs"),
      href: "/studio/procurement/compliance",
      sub: t("console.complianceHub.cois.sub", undefined, "Insurance certificates and expiries"),
    },
    {
      label: t("console.complianceHub.governance", undefined, "Governance & Privacy"),
      href: "/studio/settings/governance",
      sub: t("console.complianceHub.governance.sub", undefined, "Policies, privacy, and audit"),
    },
    {
      label: t("console.complianceHub.training", undefined, "Recert Matrix"),
      href: "/legend/compliance",
      sub: t("console.complianceHub.training.sub", undefined, "Certification currency by role"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.complianceHub.eyebrow", undefined, "Safety · Protect")}
        title={t("console.complianceHub.title", undefined, "Compliance")}
        subtitle={t(
          "console.complianceHub.subtitle",
          undefined,
          "Requirements, permits, and evidence across every protect surface.",
        )}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard
            label={t("console.complianceHub.metric.recordables", undefined, "OSHA Recordables")}
            value={fmt.number(recordables)}
          />
          <MetricCard
            label={t("console.complianceHub.metric.inspections", undefined, "Inspections")}
            value={fmt.number(inspections)}
          />
          <MetricCard
            label={t("console.complianceHub.metric.cois", undefined, "Vendor COIs")}
            value={fmt.number(cois)}
          />
          <MetricCard
            label={t("console.complianceHub.metric.permits", undefined, "Permit Types")}
            value={fmt.number(permits)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {surfaces.map((s) => (
            <Link key={s.href} href={s.href} className="hover-lift block">
              <Card>
                <div className="p-4">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">{s.sub}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
