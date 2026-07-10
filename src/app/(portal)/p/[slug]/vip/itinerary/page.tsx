import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.vip.itinerary.eyebrowPortal", undefined, "Portal")}
          title={t("p.vip.itinerary.titleFallback", undefined, "VIP Itinerary")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.vip.itinerary.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
    .select("id, name, starts_at, ends_at, status:event_state, description, location:location_id(name)")
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
        eyebrow={t("p.vip.itinerary.eyebrow", undefined, "Portal · VIP")}
        title={t("p.vip.itinerary.title", undefined, "Itinerary")}
        subtitle={
          events.length === 1
            ? days.length === 1
              ? t(
                  "p.vip.itinerary.subtitleOneEventOneDay",
                  { events: events.length, days: days.length },
                  `${events.length} Event across ${days.length} day`,
                )
              : t(
                  "p.vip.itinerary.subtitleOneEventManyDays",
                  { events: events.length, days: days.length },
                  `${events.length} Event across ${days.length} days`,
                )
            : days.length === 1
              ? t(
                  "p.vip.itinerary.subtitleManyEventsOneDay",
                  { events: events.length, days: days.length },
                  `${events.length} Events across ${days.length} day`,
                )
              : t(
                  "p.vip.itinerary.subtitleManyEventsManyDays",
                  { events: events.length, days: days.length },
                  `${events.length} Events across ${days.length} days`,
                )
        }
        breadcrumbs={[
          { label: t("p.vip.itinerary.breadcrumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.vip.itinerary.breadcrumbVip", undefined, "VIP"), href: `/p/${slug}/vip` },
          { label: t("p.vip.itinerary.breadcrumbItinerary", undefined, "Itinerary") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.vip.itinerary.metricEvents", undefined, "Events")}
            value={fmt.number(events.length)}
            accent={events.length > 0}
          />
          <MetricCard label={t("p.vip.itinerary.metricDays", undefined, "Days")} value={fmt.number(days.length)} />
          <MetricCard
            label={t("p.vip.itinerary.metricStatus", undefined, "Status")}
            value={t("p.vip.itinerary.statusConfirmed", undefined, "Confirmed")}
          />
        </div>

        {events.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("p.vip.itinerary.empty", undefined, "No upcoming events on your itinerary.")}
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <section key={day}>
                <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">{fmtDay(day)}</h3>
                <ul className="mt-3 divide-y divide-[var(--p-border)]">
                  {(byDay.get(day) ?? []).map((e) => (
                    <li key={e.id} className="flex items-start gap-3 py-2">
                      <div className="w-12 shrink-0 font-mono text-xs tabular-nums">{fmtTime(e.starts_at)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{e.name}</div>
                            <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                              {t("p.vip.itinerary.until", { time: fmtTime(e.ends_at) }, `until ${fmtTime(e.ends_at)}`)}
                              {e.location?.name ? ` · ${e.location.name}` : ""}
                            </div>
                          </div>
                          <Badge variant="muted">{toTitle(e.status)}</Badge>
                        </div>
                        {e.description && <p className="mt-1 text-xs text-[var(--p-text-2)]">{e.description}</p>}
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
