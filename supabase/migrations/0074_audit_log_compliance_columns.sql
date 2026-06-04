-- ============================================================================
-- 0074 — audit_log compliance hardening (PII 90-day retention)
-- ============================================================================
--
-- Adds pii_redacted_at marker to public.audit_events and the redaction
-- function pair (one private, one public read-only) so the audit trail
-- can satisfy GDPR Art. 5(1)(c) "data minimisation" without losing the
-- forensic record (actor_id is preserved so original user can still be
-- resolved via auth.users lookup; only the denormalized email is nulled).
--
-- Scheduling: invoke private.redact_audit_log_pii() via the
-- scheduled-tasks MCP / cron at off-peak. Monitor via
-- public.audit_log_pii_pending_count() before each run.
-- ============================================================================

alter table public.audit_events
  add column if not exists pii_redacted_at timestamptz;

create index if not exists audit_events_pii_redact_idx
  on public.audit_events (at) where pii_redacted_at is null and actor_email is not null;

comment on column public.audit_events.pii_redacted_at is
  'P1 hardening — set by private.redact_audit_log_pii() when actor_email is nulled per the 90-day retention policy (GDPR Art. 5(1)(c)).';

create schema if not exists private;

create or replace function private.redact_audit_log_pii(p_max_age_days int default 90, p_batch_size int default 5000)
returns table (redacted int, cutoff timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz;
  v_redacted int;
begin
  v_cutoff := now() - (p_max_age_days || ' days')::interval;

  with target as (
    select id
      from public.audit_events
     where at < v_cutoff
       and actor_email is not null
       and pii_redacted_at is null
     limit p_batch_size
  )
  update public.audit_events e
     set actor_email = null,
         pii_redacted_at = now()
    from target
   where e.id = target.id;

  get diagnostics v_redacted = row_count;
  return query select v_redacted, v_cutoff;
end;
$$;

comment on function private.redact_audit_log_pii is
  'Nulls audit_events.actor_email on rows older than p_max_age_days (default 90). Idempotent + batched. Returns (count, cutoff) for monitoring.';

create or replace function public.audit_log_pii_pending_count(p_max_age_days int default 90)
returns int
language sql
stable
as $$
  select count(*)::int
    from public.audit_events
   where at < (now() - (p_max_age_days || ' days')::interval)
     and actor_email is not null
     and pii_redacted_at is null;
$$;
