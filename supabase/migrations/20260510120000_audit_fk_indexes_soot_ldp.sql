-- ============================================================
-- Audit remediation: FK indexes + SOOT + LDP naming
-- ============================================================
-- 1. Missing FK indexes (16 tables) — prevents seq-scan join
--    penalties and enables efficient cascades on large tables.
-- 2. settlements.balance_due_cents → GENERATED ALWAYS (SOOT)
-- 3. LDP status → *_phase / *_state renames on 7 tables
-- ============================================================

-- ─── 1. FK indexes ───────────────────────────────────────────

-- reviews (most critical — used by tg_reviews_aggregate trigger)
create index concurrently if not exists reviews_subject_crew_member_id_idx
  on reviews (subject_crew_member_id)
  where subject_crew_member_id is not null;

create index concurrently if not exists reviews_subject_vendor_id_idx
  on reviews (subject_vendor_id)
  where subject_vendor_id is not null;

create index concurrently if not exists reviews_subject_talent_profile_id_idx
  on reviews (subject_talent_profile_id)
  where subject_talent_profile_id is not null;

create index concurrently if not exists reviews_transaction_type_transaction_id_idx
  on reviews (transaction_type, transaction_id);

-- talent_offers
create index concurrently if not exists talent_offers_talent_profile_id_idx
  on talent_offers (talent_profile_id);

create index concurrently if not exists talent_offers_client_org_id_idx
  on talent_offers (client_org_id);

-- open_call_submissions
create index concurrently if not exists open_call_submissions_open_call_id_idx
  on open_call_submissions (open_call_id);

create index concurrently if not exists open_call_submissions_talent_profile_id_idx
  on open_call_submissions (talent_profile_id);

-- job_applications
create index concurrently if not exists job_applications_job_posting_id_idx
  on job_applications (job_posting_id);

-- availability_slots
create index concurrently if not exists availability_slots_talent_profile_id_idx
  on availability_slots (talent_profile_id);

-- saved_searches
create index concurrently if not exists saved_searches_user_id_idx
  on saved_searches (user_id);

-- user_profiles
create index concurrently if not exists user_profiles_user_id_idx
  on user_profiles (user_id);

-- tours
create index concurrently if not exists tours_org_id_idx
  on tours (org_id);

-- settlements
create index concurrently if not exists settlements_org_id_idx
  on settlements (org_id);

create index concurrently if not exists settlements_project_id_idx
  on settlements (project_id)
  where project_id is not null;

-- ─── 2. SOOT: balance_due_cents as GENERATED ALWAYS ─────────
-- Drop the manually-maintained column and replace with a
-- computed column so the server never stores a stale derived value.
-- Safe to do in a transaction because settlements is a new table
-- (migration 0002) with no existing data in production yet.

alter table settlements
  drop column if exists balance_due_cents;

alter table settlements
  add column balance_due_cents integer
    generated always as (total_amount_cents - deposit_amount_cents) stored;

-- ─── 3. LDP naming: status → *_phase / *_state ──────────────
-- Rename the banned `status` columns on 7 marketplace tables.
-- Each rename is accompanied by a constraint rename so existing
-- CHECK constraints stay attached.

-- open_calls: lifecycle is sequential (draft→published→closed→archived)
alter table open_calls
  rename column status to open_call_phase;

alter table open_calls
  rename constraint open_calls_status_check to open_calls_open_call_phase_check;

-- open_call_submissions: sequential review arc
alter table open_call_submissions
  rename column status to submission_phase;

alter table open_call_submissions
  rename constraint open_call_submissions_status_check to open_call_submissions_submission_phase_check;

-- talent_offers: sequential booking arc
alter table talent_offers
  rename column status to offer_phase;

alter table talent_offers
  rename constraint talent_offers_status_check to talent_offers_offer_phase_check;

-- job_postings: sequential posting arc
alter table job_postings
  rename column status to posting_phase;

alter table job_postings
  rename constraint job_postings_status_check to job_postings_posting_phase_check;

-- job_applications: sequential application arc
alter table job_applications
  rename column status to application_phase;

alter table job_applications
  rename constraint job_applications_status_check to job_applications_application_phase_check;

-- settlements: cyclical state (pending → processing → settled → disputed)
alter table settlements
  rename column status to settlement_state;

alter table settlements
  rename constraint settlements_status_check to settlements_settlement_state_check;

-- tours: sequential lifecycle arc
alter table tours
  rename column status to tour_phase;

alter table tours
  rename constraint tours_status_check to tours_tour_phase_check;
