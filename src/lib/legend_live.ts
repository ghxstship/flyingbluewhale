/**
 * LEG3ND live sessions vocabulary — webinars / cohort labs / instructor-led
 * workshops + per-learner registrations. Enum tuples → derived types → label
 * maps + pure helpers. Backed by migration 20260623160000_legend_live_sessions
 * (legend_live_sessions, legend_session_registrations).
 */
import type { StateTone } from "@/lib/tones";
import { formatDateParts } from "@/lib/i18n/format";

export const SESSION_KINDS = ["webinar", "hands_on", "workshop", "cohort"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  webinar: "Webinar",
  hands_on: "Hands-on Lab",
  workshop: "Workshop",
  cohort: "Cohort Session",
};

export const SESSION_STATES = ["scheduled", "live", "ended", "cancelled"] as const;
export type SessionState = (typeof SESSION_STATES)[number];
export const SESSION_STATE_LABELS: Record<SessionState, string> = {
  scheduled: "Scheduled",
  live: "Live now",
  ended: "Ended",
  cancelled: "Cancelled",
};
export const SESSION_STATE_TONES: Record<SessionState, StateTone> = {
  scheduled: "info",
  live: "warning",
  ended: "muted",
  cancelled: "error",
};

export const REGISTRATION_STATES = ["registered", "waitlisted", "attended", "cancelled", "no_show"] as const;
export type RegistrationState = (typeof REGISTRATION_STATES)[number];
export const REGISTRATION_STATE_LABELS: Record<RegistrationState, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  attended: "Attended",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export type LiveSession = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  host_id: string | null;
  host_name: string | null;
  kind: SessionKind;
  course_id: string | null;
  starts_at: string;
  duration_minutes: number;
  capacity: number | null;
  location: string | null;
  join_url: string | null;
  session_state: SessionState;
};

/** Format an ISO timestamp → "Mon, Jun 23 · 16:00" (deterministic; `now` not needed). */
export function formatSessionTime(iso: string): string {
  const date = formatDateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const time = formatDateParts(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

/** Format duration minutes → "45m" / "1h 30m". */
export function formatSessionDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
