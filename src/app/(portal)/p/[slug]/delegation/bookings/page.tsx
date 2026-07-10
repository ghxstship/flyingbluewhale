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

type Booking = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: { name: string | null } | null;
};

const TRAIN_PATTERN = /(training|practice|warm[- ]?up|drill)/i;

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
          title={t("p.delegation.bookings.title", undefined, "Training Bookings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.delegation.bookings.configureSupabase", undefined, "Configure Supabase.")}
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
    .select("id, name, starts_at, ends_at, status:event_state, location:location_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(200);

  const bookings = ((data ?? []) as unknown as Booking[]).filter((b) => TRAIN_PATTERN.test(b.name));
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= Date.now());

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.bookings.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.bookings.title", undefined, "Training Bookings")}
        subtitle={
          bookings.length === 1
            ? t(
                "p.delegation.bookings.subtitle.single",
                { count: bookings.length, upcoming: upcoming.length },
                `${bookings.length} Booking · ${upcoming.length} Upcoming`,
              )
            : t(
                "p.delegation.bookings.subtitle.plural",
                { count: bookings.length, upcoming: upcoming.length },
                `${bookings.length} Bookings · ${upcoming.length} Upcoming`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.delegation.breadcrumb.delegation", undefined, "Delegation"), href: `/p/${slug}/delegation` },
          { label: t("p.delegation.bookings.breadcrumb.bookings", undefined, "Bookings") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.bookings.metric.upcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming.length)}
            accent={upcoming.length > 0}
          />
          <MetricCard
            label={t("p.delegation.bookings.metric.total", undefined, "Total")}
            value={fmtIntl.number(bookings.length)}
          />
          <MetricCard
            label={t("p.delegation.bookings.metric.past", undefined, "Past")}
            value={fmtIntl.number(bookings.length - upcoming.length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.delegation.bookings.section.bookings", undefined, "Bookings")}
          </h3>
          {bookings.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.delegation.bookings.empty",
                undefined,
                "No training bookings yet. Submit a request via your delegation lead.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{b.name}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmt(b.starts_at)} → {fmt(b.ends_at)}
                      {b.location?.name ? ` · ${b.location.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={toneFor(b.status)}>{toTitle(b.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
