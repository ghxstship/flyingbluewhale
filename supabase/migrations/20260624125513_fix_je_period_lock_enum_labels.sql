-- Bug fix: tg_je_period_lock referenced non-existent enum labels ('locked','closed').
-- accounting_period_state is uppercase {OPEN,IN_PERIOD,CLOSING,CLOSED,AUDITED,ARCHIVED};
-- 'locked' does not exist and 'closed' is the wrong case, so EVERY journal_entries
-- insert raised "invalid input value for enum" (latent — no JE had ever been inserted).
-- Correct intent: forbid postings into periods that are CLOSED/AUDITED/ARCHIVED.
create or replace function public.tg_je_period_lock() returns trigger
language plpgsql set search_path to 'public','pg_catalog' as $function$
begin
  if exists (
    select 1 from public.accounting_periods p
    where p.id = new.period_id and p.state in ('CLOSED','AUDITED','ARCHIVED')
  ) then
    raise exception 'ULG period is closed/audited/archived; entries are forbidden';
  end if;
  return new;
end $function$;
