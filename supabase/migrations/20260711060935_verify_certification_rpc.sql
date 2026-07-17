-- D-28: anonymous certification verification (audit AUDIT.md Pass D).
-- An RPC rather than a public_* view: verification is by unguessable
-- holder uuid (the QR/link on the certificate artifact). A view would be
-- anon-enumerable via PostgREST and turn private cert holdings into a
-- public directory; the RPC answers only a known id, with the same
-- column discipline as a paper certificate (holder display name, never
-- email; credential; org; dates; stored state).
create or replace function public.verify_certification(p_holder_id uuid)
returns table (
  holder_id uuid,
  holder_name text,
  certification_name text,
  certification_code text,
  recert_window_days integer,
  course_title text,
  org_name text,
  issued_at timestamptz,
  expires_on date,
  last_recert_at timestamptz,
  next_recert_due date,
  accreditation_state text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    ch.id,
    u.name,
    c.name,
    c.code,
    c.recert_window_days,
    lc.title,
    o.name,
    ch.issued_at,
    ch.expires_on,
    ch.last_recert_at,
    ch.next_recert_due,
    ch.accreditation_state::text
  from public.certification_holders ch
  join public.legend_certifications c on c.id = ch.certification_id
  join public.orgs o on o.id = ch.org_id
  left join public.users u on u.id = ch.user_id
  left join public.legend_courses lc on lc.id = ch.source_course_id
  where ch.id = p_holder_id;
$$;

revoke all on function public.verify_certification(uuid) from public;
grant execute on function public.verify_certification(uuid) to anon, authenticated;
