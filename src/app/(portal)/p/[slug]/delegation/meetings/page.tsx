import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  event_kind: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

// Kit 20 Phase A: meetings live on the unified schedule store as
// events.event_kind = 'meeting' — the name-pattern heuristic still catches
// briefing-shaped events that predate the facet.
const MEETING_PATTERN = /(meeting|chef[- ]de[- ]mission|cdm|technical brief|attaché|attache|delegation brief)/i;

function fmt(iso: string): string {
  return formatDateParts(new Date(iso), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.delegation.meetings.title", undefined, "Meetings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, event_kind, starts_at, ends_at, status:event_state, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const meetings = ((data ?? []) as unknown as EventRow[]).filter(
    (e) => e.event_kind === "meeting" || MEETING_PATTERN.test(e.name),
  );
  const upcoming = meetings.filter((m) => new Date(m.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.meetings.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.meetings.title", undefined, "Meetings")}
        subtitle={
          meetings.length === 1
            ? t(
                "p.delegation.meetings.subtitle.one",
                { upcoming: upcoming.length },
                `1 Meeting · ${upcoming.length} Upcoming`,
              )
            : t(
                "p.delegation.meetings.subtitle.other",
                { count: meetings.length, upcoming: upcoming.length },
                `${meetings.length} Meetings · ${upcoming.length} Upcoming`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.shared.breadcrumb.delegation", undefined, "Delegation"), href: `/p/${slug}/delegation` },
          { label: t("p.delegation.meetings.breadcrumb", undefined, "Meetings") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.meetings.metric.upcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming.length)}
            accent={upcoming.length > 0}
          />
          <MetricCard
            label={t("p.delegation.meetings.metric.total", undefined, "Total")}
            value={fmtIntl.number(meetings.length)}
          />
          <MetricCard
            label={t("p.delegation.meetings.metric.past", undefined, "Past")}
            value={fmtIntl.number(meetings.length - upcoming.length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.delegation.meetings.schedule.title", undefined, "Schedule")}</h3>
          {meetings.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.delegation.meetings.empty", undefined, "No meetings scheduled.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {meetings.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{m.name}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmt(m.starts_at)}
                      {m.location?.name ? ` · ${m.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={m.status === "complete" ? "muted" : "info"}>{toTitle(m.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
