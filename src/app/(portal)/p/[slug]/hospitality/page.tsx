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
        <ModuleHeader eyebrow="Portal" title="Hospitality" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: tickets }, { count: blocks }] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("accommodation_blocks").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    { href: `/p/${slug}/hospitality/itinerary`, label: "Itinerary", desc: "Day-by-day schedule for your party" },
    { href: `/p/${slug}/hospitality/guests`, label: "Guests", desc: "Roster, tickets, allocations" },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="Hospitality"
        subtitle="Premium guest experience — itinerary, transfers, dining, accommodation"
        breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Hospitality" }]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Tickets" value={fmt.number(tickets ?? 0)} />
          <MetricCard label="Room Blocks" value={fmt.number(blocks ?? 0)} />
          <MetricCard label="Status" value="Live" accent />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Need a change to your booking? Email{" "}
          <a className="text-[var(--org-primary)]" href="mailto:hospitality@lytehaus.live">
            hospitality@lytehaus.live
          </a>{" "}
          and reference your booking ID.
        </p>
      </div>
    </>
  );
}
