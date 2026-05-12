import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
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
        <ModuleHeader eyebrow="Portal" title="VIP" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: blocks }, { count: runs }] = await Promise.all([
    supabase
      .from("accommodation_blocks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("stakeholder_group", "vip"),
    supabase
      .from("dispatch_runs")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("fleet", "t1"),
  ]);

  const tiles = [
    { href: `/p/${slug}/vip/itinerary`, label: "Itinerary", desc: "Day-by-day program with private hosting" },
    { href: `/p/${slug}/vip/transport`, label: "Transport", desc: "Dedicated T1 vehicles and drivers" },
    { href: `/p/${slug}/vip/accommodation`, label: "Accommodation", desc: "Suite reservations" },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="VIP"
        subtitle="Concierge, dedicated transport, and private hosting"
        breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "VIP" }]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Suites" value={fmt.number(blocks ?? 0)} />
          <MetricCard label="T1 Runs" value={fmt.number(runs ?? 0)} />
          <MetricCard label="Status" value="Live" accent />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Concierge:{" "}
          <a className="text-[var(--org-primary)]" href="mailto:vip@flytehaus.live">
            vip@flytehaus.live
          </a>{" "}
          — 24/7 during event window.
        </p>
      </div>
    </>
  );
}
