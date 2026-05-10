import Link from "next/link";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
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
        <ModuleHeader eyebrow="Portal" title="Media" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: kbCount }] = await Promise.all([
    supabase.from("kb_articles").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    { href: `/p/${slug}/media/info`, label: "Info on Demand", desc: "Project briefings, fact sheets, biographies" },
    { href: `/p/${slug}/media/pressconf`, label: "Press Conferences", desc: "Schedule and RSVP" },
    { href: `/p/${slug}/media/services`, label: "Media Services", desc: "Studios, mixed zones, working areas" },
    { href: `/p/${slug}/media/transport`, label: "Transport", desc: "Media shuttle (T2)" },
    { href: `/p/${slug}/media/accommodation`, label: "Accommodation", desc: "Media hotel allocations" },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "media")} title="Media" />
      <div className="flex-1">
        <ModuleHeader
          eyebrow="Portal"
          title="Media"
          subtitle="Working areas, services, and editorial info for accredited media"
          breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Media" }]}
        />
        <div className="page-content space-y-5">
          <div className="metric-grid-3">
            <MetricCard label="Info Articles" value={fmt.number(kbCount ?? 0)} />
            <MetricCard label="Status" value="Live" accent />
            <MetricCard label="Last Updated" value="today" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{t.label}</div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
