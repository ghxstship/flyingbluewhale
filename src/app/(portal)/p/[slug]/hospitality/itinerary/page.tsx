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
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.hospitality.itinerary.title", undefined, "Itinerary")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
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
  // Group by day
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
        eyebrow={t("p.hospitality.itinerary.eyebrow", undefined, "Portal · Hospitality")}
        title={t("p.hospitality.itinerary.title", undefined, "Itinerary")}
        subtitle={
          events.length === 1
            ? t(
                "p.hospitality.itinerary.subtitle.singularEvent",
                { days: days.length, dayLabel: days.length === 1 ? "day" : "days" },
                `${events.length} Event across ${days.length} ${days.length === 1 ? "day" : "days"}`,
              )
            : t(
                "p.hospitality.itinerary.subtitle.pluralEvents",
                { events: events.length, days: days.length, dayLabel: days.length === 1 ? "day" : "days" },
                `${events.length} Events across ${days.length} ${days.length === 1 ? "day" : "days"}`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.hospitality.breadcrumb.hospitality", undefined, "Hospitality"),
            href: `/p/${slug}/hospitality`,
          },
          { label: t("p.hospitality.itinerary.breadcrumb", undefined, "Itinerary") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.hospitality.itinerary.metric.upcomingEvents", undefined, "Upcoming Events")}
            value={fmt.number(events.length)}
            accent={events.length > 0}
          />
          <MetricCard
            label={t("p.hospitality.itinerary.metric.days", undefined, "Days")}
            value={fmt.number(days.length)}
          />
          <MetricCard
            label={t("p.hospitality.itinerary.metric.status", undefined, "Status")}
            value={t("p.hospitality.itinerary.metric.statusConfirmed", undefined, "Confirmed")}
          />
        </div>

        {events.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "p.hospitality.itinerary.empty",
              undefined,
              "No events on your itinerary yet. Check back closer to the date — confirmed events publish here.",
            )}
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
                            <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                              {t(
                                "p.hospitality.itinerary.until",
                                { time: fmtTime(e.ends_at) },
                                `until ${fmtTime(e.ends_at)}`,
                              )}
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
