-- The 7 CHECK-text phase columns → XPMS 2.5 9-verb vocabulary (drop → rewrite → add).
-- APPLIED 2026-07-18 (ledger 20260718150701). Pairs with the xpms_phase enum migration.
do $$
declare
  r record;
  verb9 text := $q$['Discover','Design','Advance','Procure','Build','Install','Operate','Amplify','Close']$q$;
begin
  for r in
    select * from (values
      ('budgets','xpms_phase','budgets_xpms_phase_check'),
      ('cues','xpms_phase','cues_xpms_phase_check'),
      ('expenses','xpms_phase','expenses_xpms_phase_check'),
      ('kit_lines','xpms_phase','kit_lines_xpms_phase_check'),
      ('kit_options','xpms_phase','kit_options_xpms_phase_check'),
      ('kit_phase_gates','xpms_phase','kit_phase_gates_xpms_phase_check'),
      ('project_billing_draws','trigger_phase','project_billing_draws_trigger_phase_check')
    ) as t(table_name, column_name, constraint_name)
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.table_name, r.constraint_name);
    execute format('update public.%I set %I = ''Discover'' where %I = ''Discovery''',
                   r.table_name, r.column_name, r.column_name);
    execute format('update public.%I set %I = ''Procure'' where %I = ''Procurement''',
                   r.table_name, r.column_name, r.column_name);
    if r.table_name = 'kit_phase_gates' then
      execute format('alter table public.%I add constraint %I check (%I = any (array%s::text[]))',
                     r.table_name, r.constraint_name, r.column_name, verb9);
    else
      execute format('alter table public.%I add constraint %I check (%I is null or %I = any (array%s::text[]))',
                     r.table_name, r.constraint_name, r.column_name, r.column_name, verb9);
    end if;
  end loop;
end $$;
