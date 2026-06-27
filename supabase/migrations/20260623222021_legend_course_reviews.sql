-- LEG3ND course reviews — learner star-ratings + written feedback per course.
-- Distinct from the marketplace `reviews` table (bidirectional transaction
-- reviews). Backs the reviews section on /legend/learn/[course]. 3NF, org-scoped,
-- RLS. LDP naming: `*_state`.

create table public.legend_course_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  course_id uuid not null references public.legend_courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  review_state text not null default 'published' check (review_state in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, course_id, user_id)
);
create index legend_course_reviews_course_idx on public.legend_course_reviews (org_id, course_id, created_at desc) where review_state = 'published';

alter table public.legend_course_reviews enable row level security;
create policy legend_course_reviews_select on public.legend_course_reviews
  for select using (private.is_org_member(org_id));
create policy legend_course_reviews_insert on public.legend_course_reviews
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy legend_course_reviews_update on public.legend_course_reviews
  for update using (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']))
  with check (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create policy legend_course_reviews_delete on public.legend_course_reviews
  for delete using (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
grant select, insert, update, delete on public.legend_course_reviews to authenticated;
