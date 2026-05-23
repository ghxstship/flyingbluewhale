-- 20260519195510_msa_state_ldp.sql
--
-- LDP rename: independent_contractor_msas.msa_status → msa_state.
-- Backfilled from remote on 2026-05-23 (originally applied out-of-band).
-- Repo SSOT now matches production.

BEGIN;

-- 1. Enum
DO $$ BEGIN
    CREATE TYPE "public"."ic_msa_state" AS ENUM (
        'draft', 'sent', 'viewed', 'signed', 'revoked', 'superseded'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Typed column + backfill
ALTER TABLE "public"."independent_contractor_msas"
    ADD COLUMN IF NOT EXISTS "msa_state" "public"."ic_msa_state" NOT NULL DEFAULT 'draft';

UPDATE "public"."independent_contractor_msas"
    SET "msa_state" = "msa_status"::"public"."ic_msa_state"
    WHERE "msa_state" = 'draft' AND "msa_status" <> 'draft';

-- 3. Rebuild indexes
DROP INDEX IF EXISTS "public"."ic_msas_status_idx";
DROP INDEX IF EXISTS "public"."ic_msas_one_active_per_crew_idx";

CREATE INDEX IF NOT EXISTS "ic_msas_state_idx"
    ON "public"."independent_contractor_msas" ("msa_state");

CREATE UNIQUE INDEX IF NOT EXISTS "ic_msas_one_active_per_crew_idx"
    ON "public"."independent_contractor_msas" ("org_id", "crew_member_id")
    WHERE ("msa_state" = 'signed');

-- 4. Drop view before dropping msa_status column
DROP VIEW IF EXISTS "public"."independent_contractor_msas_resolved";

-- 5. Drop legacy column
ALTER TABLE "public"."independent_contractor_msas"
    DROP COLUMN IF EXISTS "msa_status";

-- 6a. record_msa_view
CREATE OR REPLACE FUNCTION public.record_msa_view(p_token uuid, p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
begin
  update public.independent_contractor_msas
  set
    first_viewed_at = coalesce(first_viewed_at, now()),
    last_viewed_at  = now(),
    view_count      = view_count + 1,
    msa_state       = case when msa_state = 'sent' then 'viewed'::"public"."ic_msa_state" else msa_state end
  where public_token = p_token
    and access_code  = upper(p_code)
    and (token_expires_at is null or token_expires_at > now());
end;
$$;

-- 6b. sign_msa
CREATE OR REPLACE FUNCTION public.sign_msa(
  p_token uuid, p_code text, p_signature text,
  p_exhibit_b jsonb, p_exhibit_c jsonb,
  p_nscb_license text, p_nscb_classification text,
  p_nscb_monetary_limit_cents bigint, p_ip inet, p_user_agent text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
declare
  v_row          record;
  v_org_settings record;
begin
  select * into v_row
  from public.independent_contractor_msas
  where public_token = p_token
    and access_code  = upper(p_code)
    and (token_expires_at is null or token_expires_at > now())
    and msa_state not in ('signed','revoked','superseded')
  for update;
  if not found then raise exception 'MSA not found, expired, or already signed'; end if;

  select default_terms, default_governing_law into v_org_settings
  from public.org_offer_letter_settings where org_id = v_row.org_id;

  update public.independent_contractor_msas set
    msa_state                  = 'signed',
    signed_at                  = now(),
    signed_signature           = p_signature,
    signed_ip                  = p_ip,
    signed_user_agent          = p_user_agent,
    body_snapshot              = coalesce(body_snapshot, v_org_settings.default_terms),
    governing_law_snapshot     = coalesce(governing_law_snapshot, v_org_settings.default_governing_law),
    exhibit_b_other_clients    = coalesce(p_exhibit_b, '[]'::jsonb),
    exhibit_c_capital_items    = coalesce(p_exhibit_c, '[]'::jsonb),
    nscb_license_number        = p_nscb_license,
    nscb_classification        = p_nscb_classification,
    nscb_monetary_limit_cents  = p_nscb_monetary_limit_cents
  where id = v_row.id
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

-- 6c. crew_member_active_msa — must DROP first due to return type change
DROP FUNCTION IF EXISTS public.crew_member_active_msa(uuid);

CREATE FUNCTION public.crew_member_active_msa(p_crew_member_id uuid)
RETURNS TABLE(msa_id uuid, msa_state "public"."ic_msa_state", signed_at timestamptz, version integer, public_token uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  select m.id, m.msa_state, m.signed_at, m.version, m.public_token
  from public.independent_contractor_msas m
  where m.crew_member_id = p_crew_member_id
    and m.revoked_at    is null
    and m.superseded_at is null
  order by
    case when m.msa_state = 'signed' then 0 else 1 end,
    m.signed_at desc nulls last,
    m.created_at desc
  limit 1;
$$;

REVOKE ALL ON FUNCTION public.crew_member_active_msa(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.crew_member_active_msa(uuid) TO authenticated, service_role;

-- 7. Recreate resolved view
CREATE OR REPLACE VIEW "public"."independent_contractor_msas_resolved" AS
SELECT m.*,
    cm.name  AS crew_member_name,
    cm.email AS crew_member_email,
    cm.phone AS crew_member_phone,
    cm.role  AS crew_member_role,
    o.name   AS org_name
FROM "public"."independent_contractor_msas" m
JOIN "public"."crew_members" cm ON (cm.id = m.crew_member_id)
JOIN "public"."orgs" o ON (o.id = m.org_id);

-- 8. Transition log
CREATE TABLE IF NOT EXISTS "public"."msa_state_transitions" (
    "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"          uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "msa_id"          uuid NOT NULL REFERENCES "public"."independent_contractor_msas"("id") ON DELETE CASCADE,
    "from_state"      "public"."ic_msa_state",
    "to_state"        "public"."ic_msa_state" NOT NULL,
    "transitioned_at" timestamptz NOT NULL DEFAULT now(),
    "transitioned_by" uuid REFERENCES "public"."users"("id"),
    "reason"          text,
    "correlation_id"  uuid
);

CREATE INDEX IF NOT EXISTS "msa_state_transitions_msa_idx"
    ON "public"."msa_state_transitions" ("msa_id", "transitioned_at" DESC);
CREATE INDEX IF NOT EXISTS "msa_state_transitions_org_idx"
    ON "public"."msa_state_transitions" ("org_id", "transitioned_at" DESC);

ALTER TABLE "public"."msa_state_transitions" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "msa_state_transitions_select_org_member" ON "public"."msa_state_transitions"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "msa_state_transitions_insert_collab" ON "public"."msa_state_transitions"
        FOR INSERT WITH CHECK ("private"."has_org_role"(org_id, ARRAY['owner','admin','controller','collaborator']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
