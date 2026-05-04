import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
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
        <ModuleHeader eyebrow="Portal" title="Delegation" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: entries }, { count: visas }, { count: orders }, { count: blocks }] = await Promise.all([
    supabase.from("delegation_entries").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("visa_cases").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("rate_card_orders").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("accommodation_blocks").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    {
      href: `/p/${slug}/delegation/entries`,
      label: "Entries",
      desc: "Roster of athletes and officials",
      count: entries ?? 0,
    },
    {
      href: `/p/${slug}/delegation/accommodation`,
      label: "Accommodation",
      desc: "Room blocks and assignments",
      count: blocks ?? 0,
    },
    { href: `/p/${slug}/delegation/transport`, label: "Transport", desc: "Vehicle bookings and dispatch" },
    {
      href: `/p/${slug}/delegation/visa`,
      label: "Visa Cases",
      desc: "Travel docs and entry letters",
      count: visas ?? 0,
    },
    {
      href: `/p/${slug}/delegation/ratecard`,
      label: "Rate-card Orders",
      desc: "Service catalog purchases",
      count: orders ?? 0,
    },
    { href: `/p/${slug}/delegation/bookings`, label: "Bookings", desc: "Training venue bookings" },
    { href: `/p/${slug}/delegation/meetings`, label: "Meetings", desc: "Team meetings, briefings" },
    { href: `/p/${slug}/delegation/cases`, label: "Cases", desc: "Open issues and requests" },
    { href: `/p/${slug}/delegation/privacy`, label: "Privacy", desc: "DSAR, consent, your data" },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="Delegation"
        subtitle="Operations dashboard for delegation attachés"
        breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Delegation" }]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Entries" value={fmt.number(entries ?? 0)} />
          <MetricCard label="Visa Cases" value={fmt.number(visas ?? 0)} />
          <MetricCard label="Orders" value={fmt.number(orders ?? 0)} />
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
      </div>
    </>
  );
}
