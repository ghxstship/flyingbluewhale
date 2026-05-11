-- =============================================================================
-- R-LDP-v2-4 step 3 :: Normalize offer_letter_status enum casing
--
-- Source plan
--   reports/LDP_REMEDIATION_PLAN_v2.md §"R-LDP-v2-4 — Engagement-Document
--   Lifecycle: rename + casing fix" (Wave 2). v2-4 has four steps; this
--   migration executes step 3:
--     "Normalize enum value casing — currently mixed (draft, sent, viewed,
--      accepted, COUNTERSIGNED, ACTIVE, declined, withdrawn, expired,
--      SUPERSEDED, VOIDED). Pick one (suggest lowercase to match legacy
--      values), migrate values, drop old."
--   Steps 1 (RENAME TYPE -> document_state), 2 (RENAME COLUMN status -> state),
--   and 4 (proposals parity) remain Wave 2 work and are NOT part of this
--   migration.
--
-- Context
--   The 4 UPPERCASE labels (COUNTERSIGNED, ACTIVE, SUPERSEDED, VOIDED) are
--   intentional new lifecycle states added by
--   20260509000002_ldp_enum_extensions.sql and re-asserted by
--   20260509060000_ldp_lifecycle_remediations_reconciled.sql. They are not
--   abandoned drafts; the casing inconsistency vs the 7 lowercase legacy
--   values is the bug.
--
--   At time of apply: all 18 prod rows use lowercase legacy values
--   (draft x5, sent x10, withdrawn x3); all PL/pgSQL function literals use
--   lowercase; the column default is lowercase; no application code
--   references the UPPERCASE labels. Lowercase is the canonical direction
--   per the plan's recommendation.
--
-- Strategy
--   Postgres can't drop enum values. Rebuild the type by routing the column
--   through `text`, dropping + recreating the type with all-lowercase labels,
--   casting back. Wrapped in a single transaction so any failure rolls back
--   atomically.
--
--   Branch dry-run was unavailable (Supabase project is on Free plan;
--   branching is Pro+). Applied directly to main given: single transaction,
--   18 rows of test data already at the target casing, every dependent
--   object audited, and no app-code references to the UPPERCASE labels.
--
-- Affected objects
--   - public.offer_letter_status (type)               -- recreated
--   - public.offer_letters.status (column + default)  -- routed through text
--   - public.offer_letters_resolved (view)            -- dropped + recreated
--   - 3 SECURITY DEFINER functions                    -- CREATE OR REPLACE for
--       accept_offer_letter, decline_offer_letter,    --   plan-cache safety
--       record_offer_letter_view                      --   (bodies unchanged)
--
-- Rollback (manual; run inside a transaction)
--   To restore the prior mixed-case enum, replace step (3)'s CREATE TYPE with:
--     CREATE TYPE public.offer_letter_status AS ENUM (
--       'draft','sent','viewed','accepted','COUNTERSIGNED','ACTIVE',
--       'declined','withdrawn','expired','SUPERSEDED','VOIDED'
--     );
--   The column cast in step (4) still works because all live rows are
--   lowercase labels that exist in both shapes. View + function recreations
--   are identical.
-- =============================================================================

BEGIN;

-- (1) Drop dependent view; we'll recreate it verbatim at the end.
DROP VIEW IF EXISTS public.offer_letters_resolved;

-- (2) Route the column through text so we can drop the enum type cleanly.
ALTER TABLE public.offer_letters
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.offer_letters
  ALTER COLUMN status TYPE text
  USING (lower(status::text));

DROP TYPE public.offer_letter_status;

-- (3) Recreate the enum with all-lowercase labels, preserving logical order.
CREATE TYPE public.offer_letter_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'accepted',
  'countersigned',
  'active',
  'declined',
  'withdrawn',
  'expired',
  'superseded',
  'voided'
);

ALTER TYPE public.offer_letter_status OWNER TO postgres;

-- (4) Cast the column back; all live values already lowercase, so direct cast.
ALTER TABLE public.offer_letters
  ALTER COLUMN status TYPE public.offer_letter_status
  USING (status::public.offer_letter_status);

ALTER TABLE public.offer_letters
  ALTER COLUMN status SET DEFAULT 'draft'::public.offer_letter_status;

-- (5) Re-issue the 3 SECURITY DEFINER functions.
--     Bodies are unchanged from the snapshot; CREATE OR REPLACE invalidates
--     cached PL/pgSQL plans that bound to the prior type's OID.

CREATE OR REPLACE FUNCTION public.accept_offer_letter(
  p_token uuid, p_code text, p_signature text, p_ip inet, p_user_agent text
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, status into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('declined','withdrawn','expired') then
    raise exception 'Letter is no longer accepting signatures (status=%)', v_status;
  end if;
  if length(coalesce(p_signature,'')) < 2 then
    raise exception 'Signature is required';
  end if;

  update offer_letters
     set status = 'accepted', accepted_at = now(),
         accepted_signature = p_signature, accepted_ip = p_ip,
         accepted_user_agent = p_user_agent
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'accepted', p_signature,
      'Letter accepted and counter-signed.',
      jsonb_build_object('ip', p_ip::text, 'user_agent', p_user_agent));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$function$;

CREATE OR REPLACE FUNCTION public.decline_offer_letter(
  p_token uuid, p_code text, p_reason text
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, status into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('accepted','withdrawn','expired') then
    raise exception 'Letter cannot be declined (status=%)', v_status;
  end if;

  update offer_letters
     set status = 'declined', declined_at = now(), decline_reason = p_reason
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'declined', 'Recipient',
      coalesce('Letter declined: ' || p_reason, 'Letter declined.'),
      jsonb_build_object('reason', p_reason));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_offer_letter_view(
  p_token uuid, p_code text
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_org_id uuid; v_first timestamptz;
begin
  select id, org_id, first_viewed_at into v_id, v_org_id, v_first
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then return; end if;

  update offer_letters
     set last_viewed_at = now(),
         first_viewed_at = coalesce(first_viewed_at, now()),
         view_count = view_count + 1,
         status = case when status = 'sent' then 'viewed'::offer_letter_status else status end
   where id = v_id;

  if v_first is null then
    insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
      values (v_id, v_org_id, 'viewed', 'Recipient', 'Letter opened for the first time.');
  end if;
end;
$function$;

-- (6) Recreate the view, preserving security_invoker semantics and grants.
CREATE VIEW public.offer_letters_resolved
  WITH (security_invoker = true) AS
SELECT ol.id,
       ol.org_id,
       ol.project_id,
       ol.crew_member_id,
       ol.role_id,
       ol.reports_to_crew_member_id,
       ol.venue_id,
       ol.employer,
       ol.classification,
       ol.rate_card_item_id,
       ol.per_diem_rate_card_item_id,
       ol.compensation_basis,
       ol.override_amount_cents,
       ol.override_per_diem_cents,
       ol.engagement_start,
       ol.engagement_end,
       ol.travel_provided,
       ol.lodging_provided,
       ol.meals_provided,
       ol.extra_inclusions,
       ol.expectations_override,
       ol.terms_override,
       ol.public_token,
       ol.access_code,
       ol.token_expires_at,
       ol.status,
       ol.sent_at,
       ol.first_viewed_at,
       ol.last_viewed_at,
       ol.view_count,
       ol.accepted_at,
       ol.accepted_signature,
       ol.accepted_ip,
       ol.accepted_user_agent,
       ol.declined_at,
       ol.decline_reason,
       ol.withdrawn_at,
       ol.snapshot,
       ol.snapshot_at,
       ol.created_by,
       ol.created_at,
       ol.updated_at,
       cm.name  AS recipient_name,
       cm.email AS recipient_email,
       cm.phone AS recipient_phone,
       cm.user_id AS recipient_user_id,
       r.label AS role_title,
       r.slug  AS role_slug,
       r.department AS role_department,
       r.description AS role_description,
       r.responsibilities AS role_responsibilities,
       rt.name  AS reports_to_name,
       rt.email AS reports_to_email,
       rt.phone AS reports_to_phone,
       v.name AS venue_name,
       l.address AS venue_address,
       l.city    AS venue_city,
       l.region  AS venue_region,
       l.country AS venue_country,
       p.name       AS project_name,
       p.slug       AS project_slug,
       p.start_date AS project_start_date,
       p.end_date   AS project_end_date,
       rc.unit_price_cents AS rate_unit_price_cents,
       rc.name AS rate_name,
       rc.sku  AS rate_sku,
       pdrc.unit_price_cents AS per_diem_unit_price_cents,
       pdrc.sku AS per_diem_sku,
       COALESCE(ol.engagement_start, p.start_date) AS effective_start,
       COALESCE(ol.engagement_end,   p.end_date)   AS effective_end,
       GREATEST(((COALESCE(ol.engagement_end, p.end_date) - COALESCE(ol.engagement_start, p.start_date)) + 1), 0) AS engagement_days,
       COALESCE(ol.travel_provided,  s.default_travel_provided)  AS effective_travel_provided,
       COALESCE(ol.lodging_provided, s.default_lodging_provided) AS effective_lodging_provided,
       COALESCE(ol.meals_provided,   s.default_meals_provided)   AS effective_meals_provided,
       COALESCE(NULLIF(ol.terms_override, ''::text), s.default_terms) AS effective_terms,
       s.default_governing_law     AS effective_governing_law,
       s.default_payment_schedule  AS effective_payment_schedule,
       s.default_confidentiality   AS effective_confidentiality,
       (s.default_inclusions || COALESCE(ol.extra_inclusions, '[]'::jsonb)) AS effective_inclusions,
       COALESCE(NULLIF(ol.expectations_override, ''::text),
                (COALESCE(r.description, ''::text) ||
                  CASE
                    WHEN (jsonb_array_length(COALESCE(r.responsibilities, '[]'::jsonb)) > 0) THEN
                      (E'\n\nKey responsibilities:\n'::text ||
                        (SELECT string_agg('• '::text || rsp.value, E'\n'::text)
                           FROM jsonb_array_elements_text(r.responsibilities) rsp(value)))
                    ELSE ''::text
                  END)
       ) AS effective_expectations,
       CASE
         WHEN (ol.override_amount_cents IS NOT NULL) THEN ol.override_amount_cents
         WHEN ((ol.compensation_basis = 'flat_fee'::public.compensation_basis) AND (rc.unit_price_cents IS NOT NULL))
           THEN (rc.unit_price_cents)::bigint
         WHEN ((ol.compensation_basis = 'per_day'::public.compensation_basis) AND (rc.unit_price_cents IS NOT NULL))
           THEN ((rc.unit_price_cents * GREATEST(((COALESCE(ol.engagement_end, p.end_date) - COALESCE(ol.engagement_start, p.start_date)) + 1), 0)))::bigint
         WHEN (ol.compensation_basis = 'tbd'::public.compensation_basis) THEN (0)::bigint
         ELSE (0)::bigint
       END AS effective_compensation_cents,
       COALESCE(ol.override_per_diem_cents, (pdrc.unit_price_cents)::bigint, (0)::bigint) AS effective_per_diem_cents,
       sa.name  AS signing_authority_name,
       sa.email AS signing_authority_email
  FROM public.offer_letters ol
       JOIN  public.crew_members cm ON cm.id = ol.crew_member_id
       JOIN  public.org_roles    r  ON r.id  = ol.role_id
       LEFT JOIN public.crew_members rt ON rt.id = ol.reports_to_crew_member_id
       LEFT JOIN public.venues       v  ON v.id  = ol.venue_id
       LEFT JOIN public.locations    l  ON l.id  = v.location_id
       JOIN  public.projects p ON p.id = ol.project_id
       LEFT JOIN public.rate_card_items rc   ON rc.id   = ol.rate_card_item_id
       LEFT JOIN public.rate_card_items pdrc ON pdrc.id = ol.per_diem_rate_card_item_id
       LEFT JOIN public.org_offer_letter_settings s ON s.org_id = ol.org_id
       LEFT JOIN public.crew_members sa ON sa.id = s.signing_authority_crew_member_id;

ALTER VIEW public.offer_letters_resolved OWNER TO postgres;

GRANT SELECT                                ON TABLE public.offer_letters_resolved TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE        ON TABLE public.offer_letters_resolved TO authenticated;
GRANT ALL                                   ON TABLE public.offer_letters_resolved TO service_role;

COMMIT;
