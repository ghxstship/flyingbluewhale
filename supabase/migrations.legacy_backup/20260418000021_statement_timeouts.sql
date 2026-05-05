-- fbw_021 · Per-role statement_timeout — H3-05 / IK-024
--
-- Caps the wall-clock any single query can occupy against each role.
-- Prevents a pathological query from monopolizing a pooler connection.

alter role anon          set statement_timeout = '5s';
alter role authenticated set statement_timeout = '10s';
alter role service_role  set statement_timeout = '60s';

alter role anon          set idle_in_transaction_session_timeout = '5s';
alter role authenticated set idle_in_transaction_session_timeout = '10s';
alter role service_role  set idle_in_transaction_session_timeout = '60s';

alter role anon          set lock_timeout = '2s';
alter role authenticated set lock_timeout = '5s';
alter role service_role  set lock_timeout = '30s';

comment on role authenticated is
  'Standard user. statement_timeout=10s, lock_timeout=5s (fbw_021).';
comment on role service_role is
  'Workers + webhooks + migrations. statement_timeout=60s (fbw_021).';
