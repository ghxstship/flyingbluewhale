-- LDP REMEDIATION: rename onboarding_steps.status → onboarding_step_state
--
-- `status` is banned in new tables per the LIFECYCLE_DECOMPOSITION_PROTOCOL.
-- onboarding_step_state is cyclical (pending → in_progress → done/waived/blocked),
-- so the canonical LDP suffix is `_state`.
--
-- References: reports/LDP_LIFECYCLE_AUDIT.md, CLAUDE.md §Backend (LDP)

-- 1. Add the new column with the same definition as the old one
alter table onboarding_steps
  add column if not exists onboarding_step_state text
    not null default 'pending'
    check (onboarding_step_state in ('pending','in_progress','done','waived','blocked'));

-- 2. Back-fill from the old column (no-op if already null-free)
update onboarding_steps set onboarding_step_state = status
  where onboarding_step_state = 'pending' and status is not null;

-- 3. Drop the old indexes that reference status
drop index if exists onboarding_steps_letter_status_idx;
drop index if exists onboarding_steps_due_idx;

-- 4. Recreate indexes on the new column
create index if not exists onboarding_steps_letter_state_idx
  on onboarding_steps(offer_letter_id, onboarding_step_state);

create index if not exists onboarding_steps_due_idx on onboarding_steps(due_at)
  where onboarding_step_state not in ('done','waived');

-- 5. Drop the old column (CASCADE removes its check constraint automatically)
alter table onboarding_steps drop column if exists status;
