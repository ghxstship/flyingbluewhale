/**
 * F6 — Video huddle shared types + helpers.
 *
 * Enum tuples, label maps, and pure compute helpers for the video_calls /
 * video_call_participants pair. This is the sibling lib for the huddle
 * `actions.ts` server file (a "use server" file may only export async
 * functions), and is safe to import from both server components and client
 * islands — it imports no server-only modules.
 *
 * Tables (video_calls / video_call_participants) are not yet in the
 * generated `database.types.ts`; call sites use the `LooseSupabase` cast
 * until PENDING_video_huddle.sql is applied + types regen.
 */

export const VIDEO_CALL_STATES = ["scheduled", "live", "ended"] as const;
export type VideoCallState = (typeof VIDEO_CALL_STATES)[number];

export const VIDEO_PARTICIPANT_ROLES = ["host", "participant"] as const;
export type VideoParticipantRole = (typeof VIDEO_PARTICIPANT_ROLES)[number];

export const VIDEO_CALL_STATE_LABELS: Record<VideoCallState, string> = {
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
};

export const VIDEO_PARTICIPANT_ROLE_LABELS: Record<VideoParticipantRole, string> = {
  host: "Host",
  participant: "Participant",
};

export type VideoCall = {
  id: string;
  org_id: string;
  meeting_id: string | null;
  title: string;
  room_name: string;
  call_state: VideoCallState;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type VideoCallParticipant = {
  id: string;
  org_id: string;
  call_id: string;
  user_id: string;
  role: VideoParticipantRole;
  joined_at: string | null;
  left_at: string | null;
};

/** A participant is "present" once they've joined and not yet left. */
export function isPresent(p: Pick<VideoCallParticipant, "joined_at" | "left_at">): boolean {
  return Boolean(p.joined_at) && !p.left_at;
}

/** Count of currently-in-the-room participants. */
export function presentCount(participants: Pick<VideoCallParticipant, "joined_at" | "left_at">[]): number {
  return participants.reduce((n, p) => n + (isPresent(p) ? 1 : 0), 0);
}

/**
 * Allowed call-state transitions, enforced server-side so a stale tab can't
 * write an illegal jump (e.g. ended → live).
 */
export const NEXT_VIDEO_CALL_STATES: Record<VideoCallState, readonly VideoCallState[]> = {
  scheduled: ["live", "ended"],
  live: ["ended"],
  ended: [],
};

export function canTransitionCall(from: VideoCallState, to: VideoCallState): boolean {
  return NEXT_VIDEO_CALL_STATES[from].includes(to);
}
