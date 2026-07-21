import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { SwapButton } from "./SwapButton";

export type MyShift = {
  id: string;
  /** "Today" | "Tomorrow" | "Fri, Jul 18" */
  dayLabel: string;
  isToday: boolean;
  time: string;
  role: string | null;
  venue: string | null;
  attendance: string;
};

const ATT_TONE: Record<string, string> = {
  scheduled: "neutral",
  checked_in: "ok",
  on_break: "warn",
  checked_out: "info",
  no_show: "danger",
};

function attLabel(a: string): string {
  return a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The viewer's own shifts — the answer to "when and where do I work?".
 *
 * COMPVSS could not answer that. `/m/schedule` listed org-wide `events`
 * with no user predicate and treated every row as a shift, while `shifts`
 * — the table that actually knows the crew member's call time, venue, role
 * and attendance — was never queried anywhere in the mobile shell. The
 * GVTEWAY portal has shown crew their real schedule the whole time; the
 * field PWA, the thing they carry, has not.
 *
 * Today is a card, not a calendar row: on a venue floor in sunlight the
 * only question is "am I on, when, and where", and it should be legible at
 * arm's length without tapping anything.
 */
export function MyShifts({
  shifts,
  labels,
}: {
  shifts: MyShift[];
  labels: {
    heading: string;
    none: string;
    noneBody: string;
    clockIn: string;
    upcoming: string;
    swap: { cta: string; reason: string; placeholder: string; send: string; cancel: string; sent: string };
  };
}) {
  const today = shifts.filter((s) => s.isToday);
  const upcoming = shifts.filter((s) => !s.isToday);

  return (
    <>
      <div className="sech">
        <h2>{labels.heading}</h2>
      </div>

      {today.length === 0 ? (
        <div className="item" style={{ display: "block" }}>
          <div className="t">{labels.none}</div>
          <div className="s">{labels.noneBody}</div>
        </div>
      ) : (
        today.map((s) => (
          <div key={s.id} className="te-clock" style={{ display: "block", marginBottom: 10 }}>
            <div
              className="wl"
              style={{
                justifyContent: "center",
                color: "rgba(255,255,255,.6)",
                fontFamily: "var(--p-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {s.role ?? labels.heading}
            </div>
            <div className="tcv">{s.time}</div>
            {s.venue && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,.75)", fontSize: 13, marginBottom: 10 }}>
                <KIcon name="MapPin" size={13} /> {s.venue}
              </div>
            )}
            <Link href="/m/clock" className="ps-btn ps-btn--cta" style={{ textDecoration: "none" }}>
              <KIcon name="Play" size={16} /> {labels.clockIn}
            </Link>
            <SwapButton shiftId={s.id} labels={labels.swap} />
          </div>
        ))
      )}

      {upcoming.length > 0 && (
        <>
          <div className="sech">
            <h2>{labels.upcoming}</h2>
          </div>
          {upcoming.map((s) => (
            <div className="item" key={s.id} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <KIcon name="CalendarClock" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">
                    {s.dayLabel} · {s.time}
                  </div>
                  <div className="s">
                    {[s.role, s.venue].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <span className={`ps-badge ps-badge--${ATT_TONE[s.attendance] ?? "neutral"}`}>
                  {attLabel(s.attendance)}
                </span>
              </div>
              <SwapButton shiftId={s.id} labels={labels.swap} />
            </div>
          ))}
        </>
      )}
    </>
  );
}
