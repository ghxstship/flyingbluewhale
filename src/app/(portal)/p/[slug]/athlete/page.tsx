import Link from "next/link";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Athlete" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      label: "Service Requests",
      desc: "Medical, transport, room — log a request",
      count: requestCount ?? 0,
    },
    { href: `/p/${slug}/athlete/training`, label: "Training", desc: "Sessions, venues, training schedule" },
    {
      href: `/p/${slug}/athlete/visa`,
      label: "Visa Cases",
      desc: "Travel docs and entry letters",
      count: visaCount ?? 0,
    },
    {
      href: `/p/${slug}/athlete/safeguarding`,
      label: "Safeguarding",
      desc: "Confidential channel — report concerns",
      count: safeguardingCount ?? 0,
    },
    { href: `/p/${slug}/athlete/privacy`, label: "Privacy", desc: "DSAR, consent, your data" },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "athlete")} title="Athlete" />
      <div className="flex-1">
        <ModuleHeader
          eyebrow="Portal"
          title="Athlete"
          subtitle="Resident services for accredited athletes"
          breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Athlete" }]}
        />
        <div className="page-content space-y-5">
          <div className="metric-grid-3">
            <MetricCard label="Open Requests" value={fmt.number(requestCount ?? 0)} />
            <MetricCard label="Visa Cases" value={fmt.number(visaCount ?? 0)} />
            <MetricCard label="Reports Filed" value={fmt.number(safeguardingCount ?? 0)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{t.label}</div>
                  {t.count != null && <Badge variant="muted">{t.count}</Badge>}
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.desc}</p>
              </Link>
            ))}
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Athlete portal services are gated on a clear vetting status. If a tile shows blocked, contact your delegation
            lead.
          </p>
        </div>
      </div>
    </div>
  );
}
