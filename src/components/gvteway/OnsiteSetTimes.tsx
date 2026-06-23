import { Radio, Clock, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

/**
 * OnsiteSetTimes — the live "My Night" schedule for the Onsite surface
 * (design_handoff §3). Reads `public.set_time` (per-stage performer slots) and
 * surfaces NOW (a set currently playing) and NEXT (the soonest upcoming) per
 * the viewer's plan, with **set-time conflict detection** (§3, "My Night does
 * set-time conflict detection"): overlapping sets the guest plans to catch are
 * flagged so they can choose. Presentational + server-safe; the page resolves
 * rows once 20260623120000_gvteway_consumer.sql is applied.
 *
 * Token-only colors.
 */
export type SetTimeRow = {
  id: string;
  stage: string;
  performer: string;
  /** ISO start. */
  startsAt: string;
  /** ISO end (optional). */
  endsAt?: string | null;
};

type Timed = { row: SetTimeRow; start: number; end: number };

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toTimed(rows: SetTimeRow[]): Timed[] {
  return rows
    .map((r) => ({
      row: r,
      start: new Date(r.startsAt).getTime(),
      // A set with no end is assumed to run 60m for overlap math.
      end: r.endsAt ? new Date(r.endsAt).getTime() : new Date(r.startsAt).getTime() + 60 * 60 * 1000,
    }))
    .filter((r) => !Number.isNaN(r.start))
    .sort((a, b) => a.start - b.start);
}

/** Two sets clash when their [start,end) windows overlap on different stages. */
function detectConflicts(timed: Timed[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const add = (id: string, performer: string) => {
    const list = conflicts.get(id) ?? [];
    list.push(performer);
    conflicts.set(id, list);
  };
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i]!;
      const b = timed[j]!;
      if (b.start >= a.end) break; // sorted by start — no later set can overlap a
      if (a.start < b.end && b.start < a.end && a.row.stage !== b.row.stage) {
        add(a.row.id, b.row.performer);
        add(b.row.id, a.row.performer);
      }
    }
  }
  return conflicts;
}

/** Bucket the schedule into now / next / later off the current time. */
function partition(timed: Timed[]) {
  const now = Date.now();
  const live = timed.filter((r) => r.start <= now && r.end > now).map((r) => r.row);
  const upcoming = timed.filter((r) => r.start > now).map((r) => r.row);
  return { live, next: upcoming.slice(0, 1), later: upcoming.slice(1) };
}

function SetRow({
  row,
  tone,
  clashesWith,
  catchAction,
}: {
  row: SetTimeRow;
  tone?: "live" | "next";
  clashesWith?: string[];
  /** When provided (onsite, signed-in), live/next sets get a "Catch" button. */
  catchAction?: (formData: FormData) => void | Promise<void>;
}) {
  const clash = clashesWith && clashesWith.length > 0;
  const catchable = catchAction && (tone === "live" || tone === "next");
  return (
    <li className="surface flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--p-text-1)]">{row.performer}</p>
        <p className="truncate font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">{row.stage}</p>
        {clash && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--p-warning-text,var(--p-text-2))]">
            <AlertTriangle size={11} aria-hidden="true" />
            Clashes with {clashesWith!.join(", ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap">
        {tone === "live" && (
          <Badge variant="error" shape="dot">
            Live
          </Badge>
        )}
        {tone === "next" && <Badge variant="info">Next</Badge>}
        {clash && (
          <Badge variant="warning" shape="dot">
            Clash
          </Badge>
        )}
        <span className="flex items-center gap-1 text-xs text-[var(--p-text-2)]">
          <Clock size={12} aria-hidden="true" />
          {fmtTime(row.startsAt)}
        </span>
        {catchable && (
          <form action={catchAction}>
            <input type="hidden" name="performer" value={row.performer} />
            <button
              type="submit"
              className="focus-ring rounded-full border border-[var(--p-border-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--p-text-1)] hover:bg-[var(--p-surface-2)]"
            >
              Catch
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

export function OnsiteSetTimes({
  sets,
  catchAction,
}: {
  sets: SetTimeRow[];
  catchAction?: (formData: FormData) => void | Promise<void>;
}) {
  if (sets.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={<Radio size={28} />}
        title="No set times yet"
        description="When the lineup drops, your now-and-next schedule lights up here."
      />
    );
  }

  const timed = toTimed(sets);
  const conflicts = detectConflicts(timed);
  const { live, next, later } = partition(timed);
  const clashCount = conflicts.size;

  return (
    <div className="space-y-4">
      {clashCount > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[var(--p-r-md)] border border-[var(--p-warning-border,var(--p-border-2))] bg-[var(--p-warning-bg,var(--p-surface-2))] px-3 py-2 text-xs text-[var(--p-warning-text,var(--p-text-1))]"
        >
          <AlertTriangle size={13} aria-hidden="true" />
          {clashCount} set{clashCount > 1 ? "s" : ""} in your night clash{clashCount > 1 ? "" : "es"} — pick your priority.
        </div>
      )}
      {live.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Now playing</h3>
          <ul className="space-y-1.5">
            {live.map((r) => (
              <SetRow key={r.id} row={r} tone="live" clashesWith={conflicts.get(r.id)} catchAction={catchAction} />
            ))}
          </ul>
        </section>
      )}
      {next.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Up next</h3>
          <ul className="space-y-1.5">
            {next.map((r) => (
              <SetRow key={r.id} row={r} tone="next" clashesWith={conflicts.get(r.id)} catchAction={catchAction} />
            ))}
          </ul>
        </section>
      )}
      {later.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">Later</h3>
          <ul className="space-y-1.5">
            {later.map((r) => (
              <SetRow key={r.id} row={r} clashesWith={conflicts.get(r.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
