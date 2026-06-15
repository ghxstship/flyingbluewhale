-- Enterprise hardening: pin search_path on all 34 app-owned functions flagged
-- by the function_search_path_mutable advisor. Prevents search_path-injection
-- against SECURITY DEFINER / trigger functions. Scope covers the schemas these
-- functions reference (pg_catalog for builtins, public for tables, private for
-- helper fns). PostGIS/extension functions are intentionally excluded.
ALTER FUNCTION private.budgets_compute_estimate() SET search_path = pg_catalog, public, private;
ALTER FUNCTION private.expenses_sync_receipt_state() SET search_path = pg_catalog, public, private;
ALTER FUNCTION private.touch_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public._salvage_city_schedule(p_role text) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.audit_log_pii_pending_count(p_max_age_days integer) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.explode_package(pkg text) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.fx_rate_on(p_from text, p_to text, p_date date) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.fx_snapshot_for_expenses() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.fx_snapshot_for_invoices() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.match_document_chunks(query_embedding vector, match_top_k integer, min_similarity numeric, org_filter uuid, project_filter uuid, source_type_filter embedding_source_type, source_id_filter uuid) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.resolve_atom(q text, max_rows integer) SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.tg_action_item_to_task() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.tg_inspection_item_to_punch() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.tg_transmittal_check_full_ack() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_ap_extractions_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_bim_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_cost_forecast_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_drawing_markup_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_estimate_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_itb_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_lien_waiver_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_org_entities_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_partner_integrations_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_payroll_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round44_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round46_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round48_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round49_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round50_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_round52_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_schedule_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_sheet_set_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_spec_section_updated_at() SET search_path = pg_catalog, public, private;
ALTER FUNCTION public.touch_transmittal_updated_at() SET search_path = pg_catalog, public, private;
