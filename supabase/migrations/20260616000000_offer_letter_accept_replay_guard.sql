-- Offer-letter accept: close the signature-replay / double-accept gap.
--
-- The public accept flow (`/offer/[token]`) calls accept_offer_letter(). The
-- prior guard only blocked declined/withdrawn/expired letters, so an
-- already-ACCEPTED letter could be re-submitted — overwriting the recorded
-- legal signature / IP / user-agent / accepted_at and inserting a duplicate
-- "accepted" activity row. There was also no row lock, so two concurrent
-- submits could both pass the check and both write.
--
-- Fix (matches the sibling sign_msa pattern):
--   1. SELECT ... FOR UPDATE — serialize concurrent accepts on the row.
--   2. Add 'accepted' to the disallowed set — a signed binding document is
--      terminal; re-acceptance is rejected, not silently overwritten.
-- Behavior is otherwise byte-identical to the live definition (letter_state
-- column, snapshot return).

create or replace function public.accept_offer_letter(
  p_token uuid, p_code text, p_signature text, p_ip inet, p_user_agent text
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, letter_state into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code)
   limit 1
   for update;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('accepted','declined','withdrawn','expired') then
    raise exception 'Letter is no longer accepting signatures (status=%)', v_status;
  end if;
  if length(coalesce(p_signature,'')) < 2 then
    raise exception 'Signature is required';
  end if;

  update offer_letters
     set letter_state = 'accepted', accepted_at = now(),
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
