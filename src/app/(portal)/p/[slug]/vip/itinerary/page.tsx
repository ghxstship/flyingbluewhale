import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  description: string | null;
  location: { name: string | null } | null;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="VIP Itinerary" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const fmtDay = (iso: string): string => fmt.dateParts(iso, { weekday: "long", month: "short", day: "numeric" });
  const since = new Date().toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, description, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(50);

  const events = ((data ?? []) as unknown as EventRow[]) ?? [];
  const byDay = new Map<string, EventRow[]>();
  for (const e of events) {
    const day = e.starts_at.slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(e);
    byDay.set(day, arr);
  }
  const days = Array.from(byDay.keys()).sort();

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · VIP"
        title="Itinerary"
        subtitle={`${events.length} Event${events.length === 1 ? "" : "s"} across ${days.length} day${days.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "VIP", href: `/p/${slug}/vip` },
          { label: "Itinerary" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Events" value={fmt.number(events.length)} accent={events.length > 0} />
          <MetricCard label="Days" value={fmt.number(days.length)} />
          <MetricCard label="Status" value="Confirmed" />
        </div>

        {events.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">No upcoming events on your itinerary.</div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <section key={day}>
                <h3 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  {fmtDay(day)}
                </h3>
                <ul className="mt-3 divide-y divide-[var(--border-color)]">
                  {(byDay.get(day) ?? []).map((e) => (
                    <li key={e.id} className="flex items-start gap-3 py-2">
                      <div className="w-12 shrink-0 font-mono text-xs tabular-nums">{fmtTime(e.starts_at)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{e.name}</div>
                            <div className="font-mono text-[10px] text-[var(--text-muted)]">
                              until {fmtTime(e.ends_at)}
                              {e.location?.name ? ` · ${e.location.name}` : ""}
                            </div>
                          </div>
                          <Badge variant="muted">{toTitle(e.status)}</Badge>
                        </div>
                        {e.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{e.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
