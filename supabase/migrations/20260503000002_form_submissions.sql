-- form_submissions: payloads collected from public /forms/[slug] pages.
-- Anonymous submitters can INSERT (gated by app-layer rate limiting and
-- the form_defs.status = 'published' check inside the API endpoint).
-- Org members can SELECT submissions for their own forms.

create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references form_defs(id) on delete cascade,
  org_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  submitter_email text,
  submitter_ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_form_created on form_submissions (form_id, created_at desc);
create index if not exists idx_form_submissions_org on form_submissions (org_id);

alter table form_submissions enable row level security;

-- Org members can read submissions for their org's forms.
drop policy if exists form_submissions_select on form_submissions;
create policy form_submissions_select on form_submissions
  for select to authenticated using (is_org_member(org_id));

-- Anonymous insert: allowed because the app-side endpoint validates that
-- the target form is 'published' before calling. We intentionally do NOT
-- allow anon SELECT — submitters can't read other submissions.
drop policy if exists form_submissions_insert_public on form_submissions;
create policy form_submissions_insert_public on form_submissions
  for insert to anon, authenticated with check (true);

comment on table form_submissions is 'Payloads collected from published /forms/[slug] pages. RLS: anon insert (gated app-side by status=published), org-member select.';
