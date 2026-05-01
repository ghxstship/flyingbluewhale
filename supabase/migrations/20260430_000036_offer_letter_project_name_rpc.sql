-- RPC referenced by src/app/offer/[token]/page.tsx — token-gated lookup of
-- the project name for an offer letter so the anonymous offer-letter page
-- can show "Atlas · MMW26 Hialeah" without exposing the projects table to
-- public RLS. Mirrors the security pattern in accept_offer_letter +
-- decline_offer_letter (security definer + token-gated).
--
-- Also relaxes log_proposal_activity's optional text/uuid params to
-- defaults so the generated TS types narrow them as optional, matching
-- the runtime nullability the helper actually allows.

create or replace function get_offer_letter_project_name(
  p_token uuid,
  p_code text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_name text;
begin
  select p.name into v_project_name
  from offer_letters ol
  join projects p on p.id = ol.project_id
  where ol.public_token = p_token
    and upper(ol.access_code) = upper(p_code)
    and (ol.token_expires_at is null or ol.token_expires_at > now());
  return v_project_name;
end;
$$;
revoke all on function get_offer_letter_project_name(uuid, text) from public;
grant execute on function get_offer_letter_project_name(uuid, text) to anon, authenticated;

create or replace function log_proposal_activity(
  p_proposal_id uuid,
  p_org_id uuid,
  p_kind text,
  p_actor_id uuid,
  p_actor_label text default null,
  p_target_kind text default null,
  p_target_id uuid default null,
  p_summary text default '',
  p_meta jsonb default '{}'::jsonb
) returns uuid language plpgsql as $$
declare
  new_id uuid;
begin
  insert into proposal_activity
    (proposal_id, org_id, kind, actor_id, actor_label, target_kind, target_id, summary, meta)
    values (p_proposal_id, p_org_id, p_kind, p_actor_id, p_actor_label, p_target_kind, p_target_id, p_summary, p_meta)
    returning id into new_id;
  return new_id;
end;
$$;
