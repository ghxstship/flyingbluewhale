/**
 * The schedule type facet (kit 20 §09 merge: `meetings` → `schedule + type`).
 *
 * `events.event_kind` is the Activity taxonomy from the console prototype's
 * schedule schema — Load In · Load Out · Delivery · Sound Check · Inspection ·
 * Shift · Meeting · Training · Run Of Show — plus `general` as the bucket for
 * rows created before the facet existed. `meeting` rows carry a 1:1
 * `meeting_event_details` sibling (MTG code, agenda/minutes markdown,
 * meeting_kind taxonomy, meeting URL).
 */

import type { ScheduleEventKind } from "@/lib/supabase/types";

export const SCHEDULE_EVENT_KINDS = [
  "general",
  "load_in",
  "load_out",
  "delivery",
  "sound_check",
  "inspection",
  "shift",
  "meeting",
  "training",
  "run_of_show",
] as const satisfies readonly ScheduleEventKind[];

export const SCHEDULE_EVENT_KIND_LABELS: Record<ScheduleEventKind, string> = {
  general: "General",
  load_in: "Load In",
  load_out: "Load Out",
  delivery: "Delivery",
  sound_check: "Sound Check",
  inspection: "Inspection",
  shift: "Shift",
  meeting: "Meeting",
  training: "Training",
  run_of_show: "Run Of Show",
};

export function scheduleKindLabel(kind: string): string {
  return SCHEDULE_EVENT_KIND_LABELS[kind as ScheduleEventKind] ?? kind;
}
