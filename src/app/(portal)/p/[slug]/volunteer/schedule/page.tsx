import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Shift = {
  id: string;
  starts_at: string;
  ends_at: string;
  role: string | null;
  attendance: string;
  break_minutes: number;
  meal_credit: boolean;
  checked_in_at: string | null;
  checked_out_at: string | null;
  venue: { name: string | null } | null;
};

const ATTEND_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  confirmed: "info",
  no_show: "error",
  attended: "success",
  late: "warning",
  excused: "muted",
  swapped: "muted",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.volunteer.schedule.eyebrowShort", undefined, "Portal")}
          title={t("p.volunteer.schedule.title", undefined, "Schedule")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.volunteer.schedule.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  // Resolve workforce member from auth user, then list their shifts.
  const { data: meRows } = await supabase
    .from("crew_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .limit(1);

  const me = (meRows ?? [])[0] as { id: string } | undefined;

  let shifts: Shift[] = [];
  if (me) {
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, starts_at, ends_at, role, attendance, break_minutes, meal_credit, checked_in_at, checked_out_at, venue:venue_id(name)",
      )
      .eq("org_id", session.orgId)
      .eq("crew_member_id", me.id)
      // Only published shifts reach a volunteer — the kit-32 field scheduler
      // writes DRAFT seats before Publish Day, and a draft assignment must
      // not surface on the volunteer's own schedule until it's published.
      .eq("publish_state", "published")
      .order("starts_at", { ascending: true })
      .limit(100);
    shifts = ((data ?? []) as unknown as Shift[]) ?? [];
  }

  const now = Date.now();
  const upcoming = shifts.filter((s) => new Date(s.starts_at).getTime() >= now);
  const past = shifts.filter((s) => new Date(s.starts_at).getTime() < now);
  const totalHours = shifts.reduce((sum, s) => {
    const ms = new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime();
    return sum + ms / 3_600_000;
  }, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.volunteer.schedule.eyebrow", undefined, "Portal · Volunteer")}
        title={t("p.volunteer.schedule.title", undefined, "Schedule")}
        subtitle={
          shifts.length === 1
            ? t(
                "p.volunteer.schedule.subtitleSingular",
                { upcoming: upcoming.length },
                `${shifts.length} Shift · ${upcoming.length} Upcoming`,
              )
            : t(
                "p.volunteer.schedule.subtitle",
                { count: shifts.length, upcoming: upcoming.length },
                `${shifts.length} Shifts · ${upcoming.length} Upcoming`,
              )
        }
        breadcrumbs={[
          { label: t("p.volunteer.schedule.crumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.volunteer.schedule.crumbVolunteer", undefined, "Volunteer"), href: `/p/${slug}/volunteer` },
          { label: t("p.volunteer.schedule.crumbSchedule", undefined, "Schedule") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.volunteer.schedule.metricUpcoming", undefined, "Upcoming")}
            value={fmt.number(upcoming.length)}
            accent={upcoming.length > 0}
          />
          <MetricCard
            label={t("p.volunteer.schedule.metricTotalHours", undefined, "Total Hours")}
            value={fmt.number(Math.round(totalHours))}
          />
          <MetricCard
            label={t("p.volunteer.schedule.metricCompleted", undefined, "Completed")}
            value={fmt.number(past.length)}
          />
        </div>

        {!me && (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "p.volunteer.schedule.notOnboarded",
              undefined,
              "You're not yet onboarded as a volunteer. Submit your application first; shifts publish here once we have you in a roster.",
            )}
          </div>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.volunteer.schedule.upcomingShifts", undefined, "Upcoming Shifts")}
          </h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.volunteer.schedule.noUpcoming", undefined, "No upcoming shifts.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {s.role ?? t("p.volunteer.schedule.volunteerShift", undefined, "Volunteer shift")}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)} → {fmtTime(s.ends_at)}
                      {s.venue?.name ? ` · ${s.venue.name}` : ""}
                      {s.meal_credit ? ` · ${t("p.volunteer.schedule.mealCredit", undefined, "meal credit")}` : ""}
                    </div>
                  </div>
                  <Badge variant={ATTEND_TONE[s.attendance] ?? "muted"}>{toTitle(s.attendance)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="surface p-5 opacity-70">
            <h3 className="text-sm font-semibold">
              {t("p.volunteer.schedule.recentShifts", undefined, "Recent Shifts")}
            </h3>
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {past.slice(-10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium">{s.role ?? t("p.volunteer.schedule.shift", undefined, "Shift")}</span>
                    <span className="ms-2 font-mono text-[11px] text-[var(--p-text-2)]">
                      {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)}
                    </span>
                  </div>
                  <Badge variant={ATTEND_TONE[s.attendance] ?? "muted"}>{s.attendance}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
