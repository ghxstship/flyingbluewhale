import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { addAvailabilityAction } from "./actions";
import { RemoveSlotButton } from "./RemoveSlotButton";

export const dynamic = "force-dynamic";

type Slot = {
  id: string;
  kind: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  label: string | null;
};

type T = Awaited<ReturnType<typeof getRequestT>>["t"];

/** Plain-language kind labels (AUDIT C-23 — "Hold: Auto-release on TTL" was
 *  internal jargon on a member-facing surface). */
function kindLabel(t: T, kind: string): string {
  switch (kind) {
    case "hold":
      return t("me.availability.kindPlain.hold", undefined, "Hold");
    case "confirm":
      return t("me.availability.kindPlain.confirm", undefined, "Confirmed");
    case "block":
      return t("me.availability.kindPlain.block", undefined, "Unavailable");
    default:
      return kind;
  }
}

function kindTone(kind: string): "success" | "error" | "warning" {
  return kind === "confirm" ? "success" : kind === "block" ? "error" : "warning";
}

/** Parse `?month=YYYY-MM`, defaulting to the current month. */
function resolveMonth(raw: string | undefined): { year: number; month: number } {
  const m = raw?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (year >= 1970 && year <= 2200 && month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

const monthParam = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return <div>{t("me.availability.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_slots")
    .select("id, kind, starts_at, ends_at, all_day, label")
    .eq("user_id", session.userId)
    .order("starts_at", { ascending: true })
    .limit(200);
  const slots = (data ?? []) as Slot[];

  const now = Date.now();
  // Past vs upcoming split on the slot END — a slot still in progress is
  // upcoming/current, only fully elapsed slots move to history (AUDIT C-23).
  const upcoming = slots.filter((s) => new Date(s.ends_at).getTime() >= now);
  const past = slots.filter((s) => new Date(s.ends_at).getTime() < now).reverse();

  // ── Month grid ──────────────────────────────────────────────────────
  const { year, month } = resolveMonth((await searchParams).month);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = firstOfMonth.getUTCDay(); // 0 = Sunday
  const cellCount = Math.ceil((leading + daysInMonth) / 7) * 7;
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  // Mid-month noon UTC so the localized month/weekday names can't slip a day
  // across the viewer's timezone.
  const monthTitle = fmt.dateParts(new Date(Date.UTC(year, month - 1, 15, 12)), {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const isThisMonth = today.getUTCFullYear() === year && today.getUTCMonth() + 1 === month;

  const slotsForDay = (day: number): Slot[] => {
    const dayStart = Date.UTC(year, month - 1, day);
    const dayEnd = Date.UTC(year, month - 1, day + 1);
    return slots.filter((s) => {
      const st = new Date(s.starts_at).getTime();
      const en = new Date(s.ends_at).getTime();
      return st < dayEnd && en > dayStart;
    });
  };

  // 2026-03-01 is a Sunday; noon UTC keeps the weekday stable in any viewer
  // timezone within a half-day of UTC.
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    fmt.dateParts(new Date(Date.UTC(2026, 2, 1 + i, 12)), { weekday: "short" }),
  );

  const slotSummary = (s: Slot) =>
    `${kindLabel(t, s.kind)}${s.label ? ` · ${s.label}` : ""} · ${fmt.dateTime(s.starts_at)}`;

  const slotRow = (s: Slot) => (
    <li key={s.id} className="surface-raised flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Badge variant={kindTone(s.kind)}>{kindLabel(t, s.kind)}</Badge>
        <span className="font-mono text-xs">
          {fmt.dateTime(s.starts_at)} → {fmt.dateTime(s.ends_at)}
        </span>
        {s.all_day && (
          <Badge variant="muted">{t("me.availability.allDayBadge", undefined, "All day")}</Badge>
        )}
        {s.label && <span className="truncate">{s.label}</span>}
      </div>
      <RemoveSlotButton slotId={s.id} summary={slotSummary(s)} />
    </li>
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">
          {t("me.availability.eyebrow", undefined, "Availability")}
        </div>
        <h1 className="mt-1">{t("me.availability.title", undefined, "Booking Calendar")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t(
            "me.availability.plainSubtitle",
            undefined,
            "Mark when you're held, confirmed, or unavailable. Booking surfaces check these dates before sending you offers.",
          )}
        </p>
      </header>

      <section className="surface-raised p-4" aria-label={monthTitle}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{monthTitle}</h2>
          <div className="flex items-center gap-1">
            <Link
              href={`/me/availability?month=${monthParam(prev.year, prev.month)}`}
              className="ps-btn ps-btn--ghost ps-btn--sm"
              aria-label={t("me.availability.prevMonth", undefined, "Previous month")}
            >
              ←
            </Link>
            <Link
              href="/me/availability"
              className="ps-btn ps-btn--ghost ps-btn--sm"
              aria-label={t("me.availability.thisMonth", undefined, "Current month")}
            >
              {t("me.availability.today", undefined, "Today")}
            </Link>
            <Link
              href={`/me/availability?month=${monthParam(next.year, next.month)}`}
              className="ps-btn ps-btn--ghost ps-btn--sm"
              aria-label={t("me.availability.nextMonth", undefined, "Next month")}
            >
              →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-[var(--p-border)] bg-[var(--p-border)] text-xs">
          {weekdayLabels.map((w) => (
            <div key={w} className="bg-[var(--p-surface-2)] px-2 py-1 text-center font-semibold text-[var(--p-text-2)]">
              {w}
            </div>
          ))}
          {Array.from({ length: cellCount }, (_, i) => {
            const day = i - leading + 1;
            const inMonth = day >= 1 && day <= daysInMonth;
            const daySlots = inMonth ? slotsForDay(day) : [];
            const isToday = isThisMonth && inMonth && today.getUTCDate() === day;
            return (
              <div
                key={i}
                className={`min-h-16 bg-[var(--p-surface-1)] p-1 ${inMonth ? "" : "opacity-40"}`}
              >
                {inMonth && (
                  <>
                    <div
                      className={`mb-1 text-right font-mono text-[11px] ${
                        isToday
                          ? "font-bold text-[var(--p-accent-text,var(--p-accent))]"
                          : "text-[var(--p-text-3)]"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {daySlots.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className={`truncate rounded px-1 py-0.5 text-[11px] leading-tight ps-badge--${
                            s.kind === "confirm" ? "ok" : s.kind === "block" ? "danger" : "warn"
                          }`}
                          title={slotSummary(s)}
                        >
                          {s.label || kindLabel(t, s.kind)}
                        </div>
                      ))}
                      {daySlots.length > 3 && (
                        <div className="px-1 text-[11px] text-[var(--p-text-3)]">
                          {t("me.availability.moreCount", { count: daySlots.length - 3 }, `+${daySlots.length - 3} more`)}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-raised p-4">
        <h2 className="eyebrow mb-3">
          {t("me.availability.addSlot", undefined, "Add slot")}
        </h2>
        <FormShell action={addAvailabilityAction} submitLabel={t("common.add", undefined, "Add")}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="availability-kind" className="text-xs font-medium">
                {t("me.availability.kindLabel", undefined, "Kind")}
              </label>
              <select id="availability-kind" name="kind" className="ps-input mt-1.5 w-full" defaultValue="hold">
                <option value="hold">
                  {t("me.availability.kindOption.hold", undefined, "Hold: tentative, can be released")}
                </option>
                <option value="confirm">
                  {t("me.availability.kindOption.confirm", undefined, "Confirmed: locked booking")}
                </option>
                <option value="block">
                  {t("me.availability.kindOption.block", undefined, "Unavailable: don't book me")}
                </option>
              </select>
            </div>
            <Input
              label={t("me.availability.label", undefined, "Label")}
              name="label"
              placeholder={t("me.availability.labelPlaceholder", undefined, "MMW26 deck build")}
            />
            <Input
              label={t("me.availability.starts", undefined, "Starts")}
              name="starts_at"
              type="datetime-local"
              required
            />
            <Input label={t("me.availability.ends", undefined, "Ends")} name="ends_at" type="datetime-local" required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="all_day" /> {t("me.availability.allDay", undefined, "All-day")}
          </label>
        </FormShell>
      </section>

      <section>
        <h2 className="eyebrow mb-3">
          {t("me.availability.upcoming", undefined, "Upcoming")}
        </h2>
        {upcoming.length === 0 ? (
          <div className="surface-raised p-6 text-sm text-[var(--p-text-2)]">
            {t("me.availability.emptyUpcoming", undefined, "Nothing coming up. Add a slot above to mark your calendar.")}
          </div>
        ) : (
          <ul className="space-y-2">{upcoming.map(slotRow)}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">
            {t("me.availability.past", undefined, "Past")}
          </h2>
          <ul className="space-y-2 opacity-70">{past.map(slotRow)}</ul>
        </section>
      )}
    </div>
  );
}
