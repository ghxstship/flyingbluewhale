-- Tour Management (kit 26) — run-of-show vocabulary on the canonical schedule
-- store. Extend `schedule_event_kind` with the genuinely-new show-day types
-- only. The base enum already carries the load-in / soundcheck / run-of-show
-- equivalents ('load_in','sound_check','run_of_show') and 'changeover' (added in
-- 20260706183521) — do NOT add hyphenated duplicates. Only `doors`, `set`, and
-- `curfew` are net-new. Must be its own migration: new enum values cannot be
-- referenced in the same transaction that adds them.

alter type public.schedule_event_kind add value if not exists 'doors';
alter type public.schedule_event_kind add value if not exists 'set';
alter type public.schedule_event_kind add value if not exists 'curfew';
