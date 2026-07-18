-- Kit 31 · COMPVSS Field conformance, resolution #18 — Post-a-Job publish flow.
-- publish_scope maps the kit's Roster Only / Org Network / Job Board segment
-- onto the real store: 'job_board' is the existing public marketplace
-- visibility; 'org_network' publishes org-wide but stays off the public feed;
-- 'roster_only' surfaces only on the project roster's Open Roles.
-- openings + shift window carry the assignment-flow field parity.

alter table public.job_postings
  add column if not exists publish_scope text not null default 'job_board'
    check (publish_scope in ('roster_only','org_network','job_board')),
  add column if not exists openings integer not null default 1 check (openings >= 1),
  add column if not exists shift_starts_at timestamptz,
  add column if not exists shift_ends_at timestamptz;

comment on column public.job_postings.publish_scope is 'Kit 31 #18 — roster_only | org_network | job_board (public feed requires job_board).';
comment on column public.job_postings.openings is 'Kit 31 #18 — number of openings for the role.';

-- The public feed now honours the scope: only job_board postings are anon-visible.
create or replace view public.public_job_board
with (security_invoker = off) as
 SELECT jp.id,
    jp.public_slug,
    jp.title,
    jp.description,
    jp.role_taxonomy,
    jp.region,
    jp.city,
    jp.country,
    jp.employment_type,
    jp.day_rate_min_cents,
    jp.day_rate_max_cents,
    jp.currency,
    jp.dates,
    jp.posting_type,
    jp.union_required,
    jp.certs_required,
    jp.travel_paid,
    jp.lodging_provided,
    jp.applicant_count,
    jp.published_at,
    jp.expires_at,
    o.name AS org_name,
    o.slug AS org_slug,
    o.logo_url AS org_logo_url
   FROM job_postings jp
     JOIN orgs o ON o.id = jp.org_id
  WHERE jp.job_posting_phase = 'published'::job_posting_status
    AND jp.publish_scope = 'job_board'
    AND jp.deleted_at IS NULL
    AND (jp.expires_at IS NULL OR jp.expires_at > now());
