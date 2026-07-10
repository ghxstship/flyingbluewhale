import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

const TRAINING_PATTERN = /(training|practice|drill|warm-up|warmup|warm up)/i;

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
          title={t("p.athlete.training.title", undefined, "Training")}
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
    .select("id, name, starts_at, ends_at, status:event_state, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const all = (data ?? []) as unknown as EventRow[];
  const sessions = all.filter((e) => TRAINING_PATTERN.test(e.name));
  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() >= Date.now());
  const past = sessions.filter((s) => new Date(s.starts_at).getTime() < Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.athlete.training.eyebrow", undefined, "Portal · Athlete")}
        title={t("p.athlete.training.title", undefined, "Training")}
        subtitle={
          sessions.length === 1
            ? t(
                "p.athlete.training.subtitle.one",
                { count: sessions.length, upcoming: upcoming.length },
                `${sessions.length} session · ${upcoming.length} Upcoming`,
              )
            : t(
                "p.athlete.training.subtitle.other",
                { count: sessions.length, upcoming: upcoming.length },
                `${sessions.length} sessions · ${upcoming.length} Upcoming`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.athlete.breadcrumb.athlete", undefined, "Athlete"), href: `/p/${slug}/athlete` },
          { label: t("p.athlete.training.breadcrumb", undefined, "Training") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.athlete.training.metric.upcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming.length)}
            accent={upcoming.length > 0}
          />
          <MetricCard
            label={t("p.athlete.training.metric.thisWeek", undefined, "This Week")}
            value={fmtIntl.number(
              sessions.filter((s) => {
                const ts = new Date(s.starts_at).getTime();
                return ts >= Date.now() && ts < Date.now() + 7 * 86_400_000;
              }).length,
            )}
          />
          <MetricCard
            label={t("p.athlete.training.metric.completed", undefined, "Completed")}
            value={fmtIntl.number(past.length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.athlete.training.upcoming.heading", undefined, "Upcoming Sessions")}
          </h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.athlete.training.upcoming.empty", undefined, "No training sessions scheduled.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmt(s.starts_at)} → {fmt(s.ends_at)}
                      {s.location?.name ? ` · ${s.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={toneFor(s.status)}>{toTitle(s.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="surface p-5 opacity-70">
            <h3 className="text-sm font-semibold">
              {t("p.athlete.training.recent.heading", undefined, "Recent Sessions")}
            </h3>
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {past.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="ms-2 font-mono text-[11px] text-[var(--p-text-2)]">{fmt(s.starts_at)}</span>
                  </div>
                  <Badge variant="muted">{toTitle(s.status)}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.athlete.training.footer.prefix",
            undefined,
            "Training sessions are events tagged via name (training / practice / drill / warm-up). Producer authors them in",
          )}{" "}
          <code>/studio/programs/training</code>
          {t("p.athlete.training.footer.suffix", undefined, "; this view is filtered for athletes.")}
        </p>
      </div>
    </>
  );
}
