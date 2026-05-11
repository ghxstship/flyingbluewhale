/**
 * Connecteam-parity surfaces — single helper file for the 10 feature
 * families added by migration 0046. Each family exports its enum tuples
 * plus 1-2 typed helpers that the COMPVSS + ATLVS pages share. Pattern
 * matches `src/lib/marketplace.ts`.
 */

// ============================================================
// Time-clock zones (geofenced punch validation)
// ============================================================
export const ZONE_LIFECYCLE_STATES = ["active", "inactive", "archived"] as const;
export type ZoneLifecycleState = (typeof ZONE_LIFECYCLE_STATES)[number];
export const PUNCH_GEOFENCE_STATES = ["inside", "outside", "unknown"] as const;
export type PunchGeofenceState = (typeof PUNCH_GEOFENCE_STATES)[number];

/** Haversine distance in meters between two lat/lng points. */
export function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Classify a punch lat/lng against a circular zone center+radius. */
export function classifyPunch(
  punch: { lat: number; lng: number } | null,
  zone: { center_lat: number; center_lng: number; radius_m: number } | null,
): PunchGeofenceState {
  if (!punch || !zone) return "unknown";
  const d = metersBetween(punch, { lat: zone.center_lat, lng: zone.center_lng });
  return d <= zone.radius_m ? "inside" : "outside";
}

// ============================================================
// Shift swaps
// ============================================================
export const SWAP_STATES = ["requested", "accepted", "declined", "approved", "cancelled"] as const;
export type SwapState = (typeof SWAP_STATES)[number];

// ============================================================
// Announcements / updates feed
// ============================================================
export const ANNOUNCEMENT_AUDIENCES = ["all", "crew", "contractors", "vendors", "admins"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];
export const PUBLISH_STATES = ["draft", "published", "archived"] as const;
export type PublishState = (typeof PUBLISH_STATES)[number];

// ============================================================
// Chat
// ============================================================
export const CHAT_ROOM_KINDS = ["direct", "group", "channel"] as const;
export type ChatRoomKind = (typeof CHAT_ROOM_KINDS)[number];
export const CHAT_MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type ChatMemberRole = (typeof CHAT_MEMBER_ROLES)[number];

// ============================================================
// Surveys + polls
// ============================================================
export const SURVEY_PUBLISH_STATES = ["draft", "published", "closed"] as const;
export type SurveyPublishState = (typeof SURVEY_PUBLISH_STATES)[number];
export const SURVEY_QUESTION_KINDS = ["single_choice", "multi_choice", "scale", "text", "boolean"] as const;
export type SurveyQuestionKind = (typeof SURVEY_QUESTION_KINDS)[number];
export const POLL_PUBLISH_STATES = ["draft", "live", "closed"] as const;
export type PollPublishState = (typeof POLL_PUBLISH_STATES)[number];

// ============================================================
// Learning — courses
// ============================================================
export const COURSE_PUBLISH_STATES = ["draft", "published", "archived"] as const;
export type CoursePublishState = (typeof COURSE_PUBLISH_STATES)[number];
export const LESSON_KINDS = ["text", "video", "pdf", "external"] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];
export const COURSE_ASSIGNMENT_STATES = ["assigned", "in_progress", "completed", "overdue", "waived"] as const;
export type CourseAssignmentState = (typeof COURSE_ASSIGNMENT_STATES)[number];

/** Score a quiz attempt → passed/score% from an answers map. */
export function scoreQuiz(
  questions: Array<{ id: string; correct_index: number }>,
  answers: Record<string, number>,
  passThresholdPct = 70,
): { score_pct: number; passed: boolean; correct: number; total: number } {
  if (questions.length === 0) return { score_pct: 0, passed: false, correct: 0, total: 0 };
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_index) correct++;
  }
  const score_pct = Math.round((correct / questions.length) * 10000) / 100;
  return { score_pct, passed: score_pct >= passThresholdPct, correct, total: questions.length };
}

// ============================================================
// Time off
// ============================================================
export const TIME_OFF_POLICY_KINDS = ["pto", "sick", "bereavement", "jury_duty", "unpaid", "other"] as const;
export type TimeOffPolicyKind = (typeof TIME_OFF_POLICY_KINDS)[number];
export const ACCRUAL_STATES = ["lump_sum", "monthly", "biweekly", "per_hour_worked"] as const;
export type AccrualState = (typeof ACCRUAL_STATES)[number];
export const TIME_OFF_REQUEST_STATES = ["pending", "approved", "denied", "cancelled"] as const;
export type TimeOffRequestState = (typeof TIME_OFF_REQUEST_STATES)[number];

/** Whole-day count between two ISO dates, inclusive of both ends. */
export function daysBetween(starts: string, ends: string): number {
  const a = new Date(starts);
  const b = new Date(ends);
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

// ============================================================
// Recognition
// ============================================================
export const RECOGNITION_VISIBILITY_STATES = ["public", "manager_only", "private"] as const;
export type RecognitionVisibilityState = (typeof RECOGNITION_VISIBILITY_STATES)[number];

// ============================================================
// Personal docs
// ============================================================
export const PERSONAL_DOC_KINDS = ["id", "license", "tax", "contract", "medical", "other"] as const;
export type PersonalDocKind = (typeof PERSONAL_DOC_KINDS)[number];

// ============================================================
// New-hire flows
// ============================================================
export const NEW_HIRE_STEP_KINDS = ["read", "sign", "upload", "quiz", "course", "form"] as const;
export type NewHireStepKind = (typeof NEW_HIRE_STEP_KINDS)[number];
export const NEW_HIRE_ASSIGNMENT_PHASES = ["not_started", "in_progress", "completed", "abandoned"] as const;
export type NewHireAssignmentPhase = (typeof NEW_HIRE_ASSIGNMENT_PHASES)[number];
