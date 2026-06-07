-- ============================================================================
-- 0053_fk_index_gap.sql
-- ============================================================================
-- Closes the 9 unindexed-FK gaps that the perf advisor caught after 0050:
--
--   * 0050 indexed every FK on the Connecteam-parity layer it knew about.
--   * 0051 added new tables (account_manager_assignments,
--     master_catalog_items, guide_access_codes) with their own FKs.
--   * The advisor pass after 0051 flagged 9 columns that still don't
--     have a covering index — either 0051 newcomers (4) or 0050
--     residuals (5).
--
-- Hot paths these unblock:
--   account_manager_assignments.chat_room_id   — portal /messages join
--   account_manager_assignments.project_id     — per-project AM lookup
--   badge_awards.org_id                        — recognition feed scan
--   chat_messages.org_id                       — RLS cross-table joins
--   guide_access_codes.org_id / created_by     — console list/audit
--   poll_votes.voter_id                        — "did I vote yet?" check
--   recognition_reactions.user_id              — reaction list per user
--   time_off_balances.policy_id                — balance lookups by policy
--
-- All idempotent.
-- ============================================================================

create index if not exists idx_am_assignments_chat_room
  on public.account_manager_assignments(chat_room_id) where chat_room_id is not null;

create index if not exists idx_am_assignments_project
  on public.account_manager_assignments(project_id) where project_id is not null;

create index if not exists idx_badge_awards_org_id
  on public.badge_awards(org_id);

create index if not exists idx_chat_messages_org_id
  on public.chat_messages(org_id);

create index if not exists idx_guide_access_codes_created_by
  on public.guide_access_codes(created_by);

create index if not exists idx_guide_access_codes_org_id
  on public.guide_access_codes(org_id);

create index if not exists idx_poll_votes_voter_id
  on public.poll_votes(voter_id);

create index if not exists idx_recognition_reactions_user_id
  on public.recognition_reactions(user_id);

create index if not exists idx_time_off_balances_policy_id
  on public.time_off_balances(policy_id);
