import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.athlete.eyebrow", undefined, "Portal")}
          title={t("p.athlete.title", undefined, "Athlete")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.athlete.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: requestCount }, { count: visaCount }, { count: safeguardingCount }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("requester_id", session.userId),
    supabase.from("visa_cases").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase
      .from("safeguarding_reports")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("reporter_id", session.userId),
  ]);

  const tiles: { href: string; label: string; desc: string; count?: number | null }[] = [
    {
      href: `/p/${slug}/athlete/requests`,
      label: t("p.athlete.tiles.requests.label", undefined, "Service Requests"),
      desc: t("p.athlete.tiles.requests.desc", undefined, "Log a request for medical, transport, or room"),
      count: requestCount ?? 0,
    },
    {
      href: `/p/${slug}/athlete/training`,
      label: t("p.athlete.tiles.training.label", undefined, "Training"),
      desc: t("p.athlete.tiles.training.desc", undefined, "Sessions, venues, training schedule"),
    },
    {
      href: `/p/${slug}/athlete/visa`,
      label: t("p.athlete.tiles.visa.label", undefined, "Visa Cases"),
      desc: t("p.athlete.tiles.visa.desc", undefined, "Travel docs and entry letters"),
      count: visaCount ?? 0,
    },
    {
      href: `/p/${slug}/athlete/safeguarding`,
      label: t("p.athlete.tiles.safeguarding.label", undefined, "Safeguarding"),
      desc: t("p.athlete.tiles.safeguarding.desc", undefined, "Confidential channel to report concerns"),
      count: safeguardingCount ?? 0,
    },
    {
      href: `/p/${slug}/athlete/privacy`,
      label: t("p.athlete.tiles.privacy.label", undefined, "Privacy"),
      desc: t("p.athlete.tiles.privacy.desc", undefined, "DSAR, consent, your data"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.athlete.eyebrow", undefined, "Portal")}
        title={t("p.athlete.title", undefined, "Athlete")}
        subtitle={t("p.athlete.subtitle", undefined, "Resident services for accredited athletes")}
        breadcrumbs={[
          { label: t("p.athlete.breadcrumbs.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.athlete.breadcrumbs.athlete", undefined, "Athlete") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.athlete.metrics.openRequests", undefined, "Open Requests")}
            value={fmt.number(requestCount ?? 0)}
          />
          <MetricCard
            label={t("p.athlete.metrics.visaCases", undefined, "Visa Cases")}
            value={fmt.number(visaCount ?? 0)}
          />
          <MetricCard
            label={t("p.athlete.metrics.reportsFiled", undefined, "Reports Filed")}
            value={fmt.number(safeguardingCount ?? 0)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{tile.label}</div>
                {tile.count != null && <Badge variant="muted">{tile.count}</Badge>}
              </div>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</p>
            </Link>
          ))}
        </div>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.athlete.footnote",
            undefined,
            "Athlete portal services are gated on a clear vetting status. If a tile shows blocked, contact your delegation lead.",
          )}
        </p>
      </div>
    </>
  );
}
