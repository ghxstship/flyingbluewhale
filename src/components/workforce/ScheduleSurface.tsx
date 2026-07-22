import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { SwapRequestButton } from "./SwapRequestButton";
import { COMPVSS_CLOCK_HREF, type ClockInDisposition, type PortalHref } from "./shell-contract";

/**
 * Shared schedule surface (ADR-0008 Move 1, Amendment 4).
 *
 * Today + upcoming-this-week shifts for the signed-in user. Same query
 * + render across COMPVSS (`/m/shift`) and the portal crew/vendor personas.
 *
 * The two CTAs this surface carries land on opposite sides of the capability
 * rule (`shell-contract.ts`), which is why the props are a union rather than
 * two strings:
 *
 * - **Swap** is a form. It files in-place on the card, in both shells.
 * - **Clock-in** needs geofence truth + offline durability, so the portal
 *   never punches. It states a `clockIn` disposition instead of an href:
 *   signpost COMPVSS for an audience entitled to it, or say nothing.
 */

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show" | string;
  role: string | null;
  break_minutes: number;
  meal_credit: boolean;
  checked_in_at: string | null;
  checked_out_at: string | null;
  venue: { name: string | null } | null;
};

const ATT_TONE: Record<string, "muted" | "success" | "warning" | "info" | "error"> = {
  scheduled: "muted",
  checked_in: "success",
  on_break: "warning",
  checked_out: "info",
  no_show: "error",
};

type ScheduleProps = {
  eyebrowLabel?: string;
  titleLabel?: string;
} & (
  | {
      variant: "mobile";
      /** COMPVSS punches in-app; the field shell is where the geofence + outbox live. */
      clockInHref: string;
      /** COMPVSS files swaps on the card at /m/schedule; /m/shift links across to it. */
      swapHref: string;
      clockIn?: never;
      revalidate?: never;
    }
  | {
      variant: "portal";
      /**
       * Required, and deliberately not an href — see `ClockInDisposition`.
       * A portal page must state whether its audience can even reach COMPVSS;
       * there is no default that silently advertises an app they can't open.
       */
      clockIn: ClockInDisposition;
      /** Portal path to re-render after an inline swap. `PortalHref` makes `/m/**` a type error. */
      revalidate: PortalHref;
      clockInHref?: never;
      swapHref?: never;
    }
);

export async function ScheduleSurface(props: ScheduleProps) {
  const { variant, eyebrowLabel, titleLabel } = props;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const { data: wfm } = await supabase
    .from("crew_members")
    .select("id, full_name:name, role")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let shifts: ShiftRow[] = [];
  if (wfm?.id) {
    const today = new Date();
    const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString();
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, starts_at, ends_at, attendance, role, break_minutes, meal_credit, checked_in_at, checked_out_at, venue:venue_id(name)",
      )
      .eq("org_id", session.orgId)
      // crew_member_id, not workforce_member_id: the reader was repointed to
      // crew_members (the SSOT, per the workforce_members merge) but the join
      // key wasn't, and shifts.workforce_member_id is null on every row — so
      // this matched nothing and the surface rendered zero shifts for everyone.
      .eq("crew_member_id", wfm.id)
      .gte("starts_at", startOfWindow)
      .lt("starts_at", endOfWindow)
      .order("starts_at", { ascending: true });
    shifts = (data ?? []) as unknown as ShiftRow[];
  }

  const todayKey = new Date().toDateString();
  const todayShifts = shifts.filter((s) => new Date(s.starts_at).toDateString() === todayKey);
  const upcoming = shifts.filter((s) => new Date(s.starts_at).toDateString() !== todayKey);

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.shift.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.shift.title", undefined, "My Shift");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-[length:var(--p-fs-h2)]">{title}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {wfm
          ? t("m.shift.greeting", { name: wfm.full_name }, `Hello, ${wfm.full_name}.`)
          : t("m.shift.welcome", undefined, "Welcome.")}{" "}
        {props.variant === "mobile" ? (
          <>
            {t("m.shift.useBefore", undefined, "Use")}{" "}
            <Link href={props.clockInHref} className="text-[var(--p-accent)]">
              {t("m.shift.useLink", undefined, "check-in")}
            </Link>{" "}
            {t("m.shift.useAfter", undefined, "to clock in / out and take breaks.")}
          </>
        ) : (
          t("p.shift.portalIntro", undefined, "Your shifts for the week ahead.")
        )}
      </p>

      {!wfm && (
        <div className="surface mt-6 p-4 text-sm">
          {t(
            "m.shift.noProfile",
            undefined,
            "Your workforce profile isn't linked to this account yet. Ask your supervisor to connect your record.",
          )}
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("m.shift.today", undefined, "Today")}
        </h2>
        <ul className="mt-3 space-y-2">
          {todayShifts.length === 0 ? (
            <li>
              <EmptyState size="compact" title={t("m.shift.noShiftToday", undefined, "No Shift Today")} />
            </li>
          ) : (
            todayShifts.map((s) => (
              <li key={s.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {s.venue?.name ?? t("m.shift.unassignedVenue", undefined, "Unassigned venue")}
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                      {s.role ? ` · ${s.role}` : wfm?.role ? ` · ${wfm.role}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {s.break_minutes > 0 && (
                        <Badge variant="muted">
                          {t("m.shift.breakMinutes", { n: s.break_minutes }, `Break ${s.break_minutes}m`)}
                        </Badge>
                      )}
                      {s.meal_credit && (
                        <Badge variant="success">{t("m.shift.mealCredit", undefined, "Meal Credit")}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={ATT_TONE[s.attendance] ?? "muted"}>{toTitle(s.attendance)}</Badge>
                </div>
                {/* Filing happens on the card — the shift you're looking at is
                    the one you can't make. */}
                {props.variant === "portal" && <SwapRequestButton shiftId={s.id} revalidate={props.revalidate} />}
              </li>
            ))
          )}
        </ul>
      </section>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("m.shift.upcomingThisWeek", undefined, "Upcoming this week")}
          </h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="surface p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">
                      {s.venue?.name ?? t("m.shift.unassignedVenue", undefined, "Unassigned venue")}
                    </div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">
                      {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                    </div>
                  </div>
                  <Badge variant="muted">{toTitle(s.attendance)}</Badge>
                </div>
                {props.variant === "portal" && <SwapRequestButton shiftId={s.id} revalidate={props.revalidate} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {props.variant === "mobile" ? (
        <div className="mt-8 grid grid-cols-2 gap-2">
          <Link href={props.clockInHref} className="ps-btn">
            {t("m.shift.checkIn", undefined, "Check in")}
          </Link>
          <Link href={props.swapHref} className="ps-btn ps-btn--ghost">
            {t("m.shift.swapShift", undefined, "Swap shift")}
          </Link>
        </div>
      ) : (
        props.clockIn === "compvss" && (
          /* A signpost, not a CTA. The punch is in COMPVSS because it needs a
             geofence fix and an offline queue, and saying so is more useful
             than a button that would silently record a worse punch. Only
             rendered for audiences that actually hold COMPVSS reach. */
          <div className="surface-inset mt-8 p-4">
            <h2 className="text-sm font-semibold">Clocking in</h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              Punches happen in COMPVSS on your phone. It records where you are and still works when the signal
              doesn&rsquo;t. Everything else on this page you can do right here.
            </p>
            <Link href={COMPVSS_CLOCK_HREF} className="ps-btn ps-btn--tertiary ps-btn--sm mt-3">
              Open COMPVSS
            </Link>
          </div>
        )
      )}
    </div>
  );
}
