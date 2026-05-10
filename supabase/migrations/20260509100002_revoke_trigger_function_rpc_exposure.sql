-- Sweep 16 — trigger functions are not meant to be callable as RPC.
-- Supabase advisor lint 'anon_security_definer_function_executable'
-- flagged these as exposed via /rest/v1/rpc/<name>. Revoke EXECUTE
-- from public/anon/authenticated; the trigger itself runs as superuser
-- internally and is unaffected.
DO $$
DECLARE
  fn_name text;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'tg_holds_auto_promote()',
    'tg_job_applications_count()',
    'tg_open_call_submissions_count()',
    'tg_reviews_aggregate()',
    'tg_reviews_release_pair()',
    'tg_settlement_compute_balance()'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC', fn_name);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon', fn_name);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM authenticated', fn_name);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Function % not found, skipping', fn_name;
    END;
  END LOOP;
END $$;
