-- Independent Contractor MSA — per-crew-member agreement document.
-- Enforces Nevada IC classification compliance (NRS 608 / AB 5-equivalent).
-- One signed MSA per (org, crew_member) enforced by partial unique index.
--
-- NOTE: msa_status (text) is the column as originally shipped. Migration
-- 20260519000001_msa_state_ldp.sql renames it to msa_state (ic_msa_state enum)
-- per the Lifecycle Decomposition Protocol §NAMING DISCIPLINE.

CREATE TABLE IF NOT EXISTS "public"."independent_contractor_msas" (
    "id"                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "org_id"                    uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "crew_member_id"            uuid NOT NULL REFERENCES "public"."crew_members"("id") ON DELETE CASCADE,
    "public_token"              uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    "access_code"               text NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6)),
    "token_expires_at"          timestamptz,
    "msa_status"                text NOT NULL DEFAULT 'draft',
    "version"                   integer NOT NULL DEFAULT 1,
    "body_snapshot"             text,
    "governing_law_snapshot"    text,
    "exhibit_b_other_clients"   jsonb NOT NULL DEFAULT '[]',
    "exhibit_c_capital_items"   jsonb NOT NULL DEFAULT '[]',
    "nscb_license_number"       text,
    "nscb_classification"       text,
    "nscb_monetary_limit_cents" bigint,
    "sent_at"                   timestamptz,
    "first_viewed_at"           timestamptz,
    "last_viewed_at"            timestamptz,
    "view_count"                integer NOT NULL DEFAULT 0,
    "signed_at"                 timestamptz,
    "signed_signature"          text,
    "signed_ip"                 inet,
    "signed_user_agent"         text,
    "revoked_at"                timestamptz,
    "revoke_reason"             text,
    "superseded_at"             timestamptz,
    "superseded_by_msa_id"      uuid REFERENCES "public"."independent_contractor_msas"("id"),
    "created_by"                uuid REFERENCES "public"."users"("id"),
    "created_at"                timestamptz NOT NULL DEFAULT now(),
    "updated_at"                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ic_msas_org_id_idx"
    ON "public"."independent_contractor_msas" ("org_id");
CREATE INDEX IF NOT EXISTS "ic_msas_crew_member_id_idx"
    ON "public"."independent_contractor_msas" ("crew_member_id");
CREATE INDEX IF NOT EXISTS "ic_msas_public_token_idx"
    ON "public"."independent_contractor_msas" ("public_token");
CREATE INDEX IF NOT EXISTS "ic_msas_status_idx"
    ON "public"."independent_contractor_msas" ("msa_status");
CREATE UNIQUE INDEX IF NOT EXISTS "ic_msas_one_active_per_crew_idx"
    ON "public"."independent_contractor_msas" ("org_id", "crew_member_id")
    WHERE (msa_status = 'signed');

ALTER TABLE "public"."independent_contractor_msas" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "ic_msas_org_select" ON "public"."independent_contractor_msas"
        FOR SELECT USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ic_msas_org_insert" ON "public"."independent_contractor_msas"
        FOR INSERT WITH CHECK ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ic_msas_org_update" ON "public"."independent_contractor_msas"
        FOR UPDATE USING ("private"."is_org_member"(org_id))
        WITH CHECK ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ic_msas_org_delete" ON "public"."independent_contractor_msas"
        FOR DELETE USING ("private"."is_org_member"(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Token-gated RPCs (SECURITY DEFINER — callable by anon for the signing flow).

CREATE OR REPLACE FUNCTION public.get_msa_by_token(p_token uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
declare
  v_row record;
begin
  select * into v_row
  from public.independent_contractor_msas_resolved
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now())
  limit 1;

  if not found then
    return null;
  end if;

  return to_jsonb(v_row);
end;
$$;

CREATE OR REPLACE FUNCTION public.record_msa_view(p_token uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
begin
  update public.independent_contractor_msas
  set
    first_viewed_at = coalesce(first_viewed_at, now()),
    last_viewed_at = now(),
    view_count = view_count + 1,
    msa_status = case when msa_status = 'sent' then 'viewed' else msa_status end
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now());
end;
$$;

CREATE OR REPLACE FUNCTION public.sign_msa(
  p_token                     uuid,
  p_code                      text,
  p_signature                 text,
  p_exhibit_b                 jsonb,
  p_exhibit_c                 jsonb,
  p_nscb_license              text,
  p_nscb_classification       text,
  p_nscb_monetary_limit_cents bigint,
  p_ip                        inet,
  p_user_agent                text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
declare
  v_row record;
  v_org_settings record;
begin
  select * into v_row
  from public.independent_contractor_msas
  where public_token = p_token
    and access_code = upper(p_code)
    and (token_expires_at is null or token_expires_at > now())
    and msa_status not in ('signed','revoked','superseded')
  for update;

  if not found then
    raise exception 'MSA not found, expired, or already signed';
  end if;

  select default_terms, default_governing_law
    into v_org_settings
  from public.org_offer_letter_settings
  where org_id = v_row.org_id;

  update public.independent_contractor_msas
  set
    msa_status = 'signed',
    signed_at = now(),
    signed_signature = p_signature,
    signed_ip = p_ip,
    signed_user_agent = p_user_agent,
    body_snapshot = coalesce(body_snapshot, v_org_settings.default_terms),
    governing_law_snapshot = coalesce(governing_law_snapshot, v_org_settings.default_governing_law),
    exhibit_b_other_clients = coalesce(p_exhibit_b, '[]'::jsonb),
    exhibit_c_capital_items = coalesce(p_exhibit_c, '[]'::jsonb),
    nscb_license_number = p_nscb_license,
    nscb_classification = p_nscb_classification,
    nscb_monetary_limit_cents = p_nscb_monetary_limit_cents
  where id = v_row.id
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

CREATE OR REPLACE FUNCTION public.crew_member_active_msa(p_crew_member_id uuid)
RETURNS TABLE(msa_id uuid, msa_status text, signed_at timestamptz, version integer, public_token uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  select
    m.id,
    m.msa_status,
    m.signed_at,
    m.version,
    m.public_token
  from public.independent_contractor_msas m
  where m.crew_member_id = p_crew_member_id
    and m.revoked_at is null
    and m.superseded_at is null
  order by
    case when m.msa_status = 'signed' then 0 else 1 end,
    m.signed_at desc nulls last,
    m.created_at desc
  limit 1;
$$;

REVOKE ALL ON FUNCTION public.get_msa_by_token(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.record_msa_view(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.sign_msa(uuid, text, text, jsonb, jsonb, text, text, bigint, inet, text) FROM public;
REVOKE ALL ON FUNCTION public.crew_member_active_msa(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.get_msa_by_token(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_msa_view(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sign_msa(uuid, text, text, jsonb, jsonb, text, text, bigint, inet, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crew_member_active_msa(uuid) TO authenticated, service_role;

CREATE OR REPLACE VIEW "public"."independent_contractor_msas_resolved" AS
SELECT
    m.*,
    cm.name  AS crew_member_name,
    cm.email AS crew_member_email,
    cm.phone AS crew_member_phone,
    cm.role  AS crew_member_role,
    o.name   AS org_name
FROM "public"."independent_contractor_msas" m
JOIN "public"."crew_members" cm ON (cm.id = m.crew_member_id)
JOIN "public"."orgs" o ON (o.id = m.org_id);
