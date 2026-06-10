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

const PRESS_PATTERN = /(press[- ]?conference|pressconf|press[- ]?brief|media[- ]?brief|presser)/i;

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "info",
  in_progress: "warning",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
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
          eyebrow={t("p.media.pressconf.eyebrow.short", undefined, "Portal")}
          title={t("p.media.pressconf.title", undefined, "Press Conferences")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.media.pressconf.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
    .select("id, name, starts_at, ends_at, event_state, description, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const all = ((data ?? []) as unknown as EventRow[]) ?? [];
  const conferences = all.filter((e) => PRESS_PATTERN.test(e.name));
  const upcoming = conferences.filter((c) => new Date(c.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.media.pressconf.eyebrow", undefined, "Portal · Media")}
        title={t("p.media.pressconf.title", undefined, "Press Conferences")}
        subtitle={
          conferences.length === 1
            ? t(
                "p.media.pressconf.subtitle.one",
                { count: conferences.length },
                `${conferences.length} press conference`,
              )
            : t(
                "p.media.pressconf.subtitle.other",
                { count: conferences.length },
                `${conferences.length} press conferences`,
              )
        }
        breadcrumbs={[
          { label: t("p.media.pressconf.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.pressconf.breadcrumb.media", undefined, "Media"), href: `/p/${slug}/media` },
          { label: t("p.media.pressconf.breadcrumb.current", undefined, "Press Conferences") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.pressconf.metric.upcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming.length)}
            accent={upcoming.length > 0}
          />
          <MetricCard
            label={t("p.media.pressconf.metric.scheduled", undefined, "Scheduled")}
            value={fmtIntl.number(conferences.length)}
          />
          <MetricCard
            label={t("p.media.pressconf.metric.past", undefined, "Past")}
            value={fmtIntl.number(conferences.length - upcoming.length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.media.pressconf.schedule.heading", undefined, "Schedule")}</h3>
          {conferences.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.media.pressconf.schedule.empty",
                undefined,
                'No press conferences scheduled. Producer publishes events containing "press conference" or "media briefing" in the name.',
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {conferences.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                      {fmt(c.starts_at)} → {fmt(c.ends_at)}
                      {c.location?.name ? ` · ${c.location.name}` : ""}
                    </div>
                    {c.description && <p className="mt-1 text-xs text-[var(--p-text-2)]">{c.description}</p>}
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t("p.media.pressconf.rsvp.prefix", undefined, "To RSVP, email")}{" "}
          <a className="text-[var(--p-accent)]" href="mailto:press@atlvs.pro">
            press@atlvs.pro
          </a>{" "}
          {t("p.media.pressconf.rsvp.suffix", undefined, "with your accreditation number and the conference name.")}
        </p>
      </div>
    </>
  );
}
