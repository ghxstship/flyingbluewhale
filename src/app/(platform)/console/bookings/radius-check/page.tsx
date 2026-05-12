import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  offer_letter_status: string | null;
  performance_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  talent_profile: { display_name: string | null } | null;
};

type RadiusHit = {
  offerId: string;
  artist: string;
  venue: string;
  city: string;
  date: string;
  distanceKm: number;
  daysDelta: number;
  severity: "critical" | "warning" | "ok";
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function RadiusCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ radiusKm?: string; dayWindow?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const radiusKm = Math.min(Math.max(Number(sp.radiusKm ?? 200), 10), 1000);
  const dayWindow = Math.min(Math.max(Number(sp.dayWindow ?? 30), 1), 365);
  const statusFilter = sp.status ?? "active";

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Radius Clause Check" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Load offers with venue geo + talent info
  const activeStatuses =
    statusFilter === "all"
      ? ["draft", "sent", "countersigned", "active"]
      : ["countersigned", "active", "sent"];

  const { data } = await supabase
    .from("talent_offers")
    .select(
      "id, offer_letter_status, performance_date, venue_name, venue_city, venue_lat, venue_lng, talent_profile:talent_profile_id(display_name)",
    )
    .eq("org_id", session.orgId)
    .in("offer_letter_status", activeStatuses)
    .not("performance_date", "is", null)
    .not("venue_lat", "is", null)
    .not("venue_lng", "is", null)
    .order("performance_date", { ascending: true })
    .limit(500);

  const offers = (data ?? []) as OfferRow[];

  // Cross-compare every pair of offers by the same artist
  const byArtist = new Map<string, OfferRow[]>();
  for (const o of offers) {
    const name = o.talent_profile?.display_name ?? "Unknown";
    const list = byArtist.get(name) ?? [];
    list.push(o);
    byArtist.set(name, list);
  }

  const hits: RadiusHit[] = [];

  for (const [artist, artistOffers] of byArtist) {
    for (let i = 0; i < artistOffers.length; i++) {
      for (let j = i + 1; j < artistOffers.length; j++) {
        const a = artistOffers[i];
        const b = artistOffers[j];
        if (!a.venue_lat || !a.venue_lng || !b.venue_lat || !b.venue_lng) continue;
        if (!a.performance_date || !b.performance_date) continue;

        const distKm = haversineKm(a.venue_lat, a.venue_lng, b.venue_lat, b.venue_lng);
        const daysDelta = Math.abs(
          (new Date(a.performance_date).getTime() - new Date(b.performance_date).getTime()) / 86400000,
        );

        if (distKm <= radiusKm && daysDelta <= dayWindow) {
          const severity: RadiusHit["severity"] = distKm < radiusKm * 0.5 && daysDelta < dayWindow * 0.3 ? "critical" : daysDelta < dayWindow * 0.5 ? "warning" : "ok";
          hits.push({
            offerId: b.id,
            artist,
            venue: b.venue_name ?? "—",
            city: b.venue_city ?? "—",
            date: b.performance_date,
            distanceKm: Math.round(distKm),
            daysDelta: Math.round(daysDelta),
            severity,
          });
        }
      }
    }
  }

  hits.sort((a, b) => {
    const sev = { critical: 0, warning: 1, ok: 2 };
    return sev[a.severity] - sev[b.severity] || a.daysDelta - b.daysDelta;
  });

  const critical = hits.filter((h) => h.severity === "critical").length;
  const warnings = hits.filter((h) => h.severity === "warning").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="Radius Clause Check"
        subtitle="Prism.fm parity — detect artist bookings that may violate radius clauses by geographic proximity and date window."
      />
      <div className="page-content space-y-5">
        {/* Filter controls */}
        <form method="GET" className="surface flex flex-wrap items-end gap-4 p-4">
          <label className="block text-xs font-semibold">
            Radius (km)
            <input
              type="number"
              name="radiusKm"
              defaultValue={radiusKm}
              min={10}
              max={1000}
              className="mt-1 block w-28 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            Day window
            <input
              type="number"
              name="dayWindow"
              defaultValue={dayWindow}
              min={1}
              max={365}
              className="mt-1 block w-28 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            Status
            <select
              name="status"
              defaultValue={statusFilter}
              className="mt-1 block rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <option value="active">Active / Signed</option>
              <option value="all">All including drafts</option>
            </select>
          </label>
          <button type="submit" className="btn btn-sm btn-primary">
            Run Check
          </button>
        </form>

        <div className="metric-grid-3">
          <MetricCard label="Offers Scanned" value={String(offers.length)} />
          <MetricCard label="Critical Conflicts" value={String(critical)} accent={critical > 0} />
          <MetricCard label="Warnings" value={String(warnings)} />
        </div>

        {hits.length === 0 ? (
          <EmptyState
            title="No Radius Conflicts Found"
            description={`No artist bookings are within ${radiusKm}km and ${dayWindow} days of each other. Adjust the radius or day window above to broaden the check.`}
          />
        ) : (
          <div className="surface">
            <div className="border-b border-[var(--border-color)] px-5 py-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              {hits.length} conflict{hits.length === 1 ? "" : "s"} found
            </div>
            <ul className="divide-y divide-[var(--border-color)]">
              {hits.map((h, i) => (
                <li key={`${h.offerId}-${i}`} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={h.severity === "critical" ? "error" : h.severity === "warning" ? "warning" : "muted"}
                      >
                        {h.severity}
                      </Badge>
                      <span className="text-sm font-semibold">{h.artist}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      {h.venue} · {h.city}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
                      {h.date} · {h.distanceKm} km away · {h.daysDelta} day{h.daysDelta === 1 ? "" : "s"} apart
                    </div>
                  </div>
                  <Link
                    href={`/console/bookings/deals/${h.offerId}`}
                    className="btn btn-sm btn-outline flex-shrink-0"
                  >
                    View Deal
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="surface p-4 text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-semibold">Methodology</p>
          <p>
            Compares all active talent offers with venue coordinates. Uses the Haversine formula for great-circle
            distance. &quot;Critical&quot; = within 50% of radius threshold AND 30% of day window. Competing with
            Prism.fm radius clause management.
          </p>
        </div>
      </div>
    </>
  );
}
