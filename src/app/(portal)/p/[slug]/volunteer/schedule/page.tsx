import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Schedule" />
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
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  // Resolve workforce member from auth user, then list their shifts.
  const { data: meRows } = await supabase
    .from("workforce_members")
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
      .eq("workforce_member_id", me.id)
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
        eyebrow="Portal · Volunteer"
        title="Schedule"
        subtitle={`${shifts.length} Shift${shifts.length === 1 ? "" : "s"} · ${upcoming.length} Upcoming`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Volunteer", href: `/p/${slug}/volunteer` },
          { label: "Schedule" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={fmt.number(upcoming.length)} accent={upcoming.length > 0} />
          <MetricCard label="Total Hours" value={fmt.number(Math.round(totalHours))} />
          <MetricCard label="Completed" value={fmt.number(past.length)} />
        </div>

        {!me && (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            You're not yet onboarded as a volunteer. Submit your application first; shifts publish here once we have you
            in a roster.
          </div>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Upcoming Shifts</h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No upcoming shifts.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{s.role ?? "Volunteer shift"}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)} → {fmtTime(s.ends_at)}
                      {s.venue?.name ? ` · ${s.venue.name}` : ""}
                      {s.meal_credit ? " · meal credit" : ""}
                    </div>
                  </div>
                  <Badge variant={ATTEND_TONE[s.attendance] ?? "muted"}>{s.attendance.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="surface p-5 opacity-70">
            <h3 className="text-sm font-semibold">Recent Shifts</h3>
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {past.slice(-10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium">{s.role ?? "Shift"}</span>
                    <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">
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
