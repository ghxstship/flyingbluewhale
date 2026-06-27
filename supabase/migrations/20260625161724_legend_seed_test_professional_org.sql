-- Clone the demo org's LEG3ND learning dataset into the Test Professional Org
-- (f4509a5f) so the per-persona e2e suite's learner (crew) + operator (owner)
-- fixtures — whose last_org_id is pinned to f4509a5f — have real published
-- courses / lessons / assessments / live sessions / vouchers / certifications
-- to drive. Idempotent: every cloned row's id is derived deterministically via
-- uuid_generate_v5 from the source demo id, so re-applying is a no-op
-- (ON CONFLICT DO NOTHING). Data-only seed (no DDL).
do $$
declare
  src uuid := '68672cc3-0667-4234-ad77-49325e173175'; -- demo org
  dst uuid := 'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7'; -- test professional org
  ns  uuid := uuid_generate_v5(uuid_ns_url(), 'legend-seed:test-professional');
begin
  -- Certifications (referenced by courses.grants_certification_id)
  insert into public.legend_certifications
    (id, org_id, code, name, description, validity_months, recert_window_days, certification_state, created_by, created_at, updated_at)
  select uuid_generate_v5(ns, 'cert:'||c.id::text), dst, c.code, c.name, c.description,
         c.validity_months, c.recert_window_days, c.certification_state, null, now(), now()
  from public.legend_certifications c
  where c.org_id = src and c.deleted_at is null
  on conflict (id) do nothing;

  -- Courses
  insert into public.legend_courses
    (id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_by, created_at, updated_at)
  select uuid_generate_v5(ns, 'course:'||c.id::text), dst, c.title, c.summary, c.cover_path,
         c.points_reward,
         case when c.grants_certification_id is null then null
              else uuid_generate_v5(ns, 'cert:'||c.grants_certification_id::text) end,
         c.course_state, null, now(), now()
  from public.legend_courses c
  where c.org_id = src and c.deleted_at is null
  on conflict (id) do nothing;

  -- Modules
  insert into public.course_modules
    (id, org_id, course_id, title, sort_order, created_at, updated_at)
  select uuid_generate_v5(ns, 'module:'||m.id::text), dst,
         uuid_generate_v5(ns, 'course:'||m.course_id::text), m.title, m.sort_order, now(), now()
  from public.course_modules m
  where m.org_id = src
  on conflict (id) do nothing;

  -- Lessons
  insert into public.lessons
    (id, org_id, course_id, module_id, title, kind, media_url, body_html, duration_seconds, sort_order, lesson_state, created_at, updated_at)
  select uuid_generate_v5(ns, 'lesson:'||l.id::text), dst,
         uuid_generate_v5(ns, 'course:'||l.course_id::text),
         case when l.module_id is null then null else uuid_generate_v5(ns, 'module:'||l.module_id::text) end,
         l.title, l.kind, l.media_url, l.body_html, l.duration_seconds, l.sort_order, l.lesson_state, now(), now()
  from public.lessons l
  where l.org_id = src and l.deleted_at is null
  on conflict (id) do nothing;

  -- Assessments
  insert into public.assessments
    (id, org_id, course_id, lesson_id, title, pass_pct, max_attempts, assessment_state, created_at, updated_at)
  select uuid_generate_v5(ns, 'assessment:'||a.id::text), dst,
         case when a.course_id is null then null else uuid_generate_v5(ns, 'course:'||a.course_id::text) end,
         case when a.lesson_id is null then null else uuid_generate_v5(ns, 'lesson:'||a.lesson_id::text) end,
         a.title, a.pass_pct, a.max_attempts, a.assessment_state, now(), now()
  from public.assessments a
  where a.org_id = src and a.deleted_at is null
  on conflict (id) do nothing;

  -- Assessment questions
  insert into public.assessment_questions
    (id, org_id, assessment_id, prompt, options, correct_index, points, sort_order, created_at, updated_at)
  select uuid_generate_v5(ns, 'aq:'||q.id::text), dst,
         uuid_generate_v5(ns, 'assessment:'||q.assessment_id::text),
         q.prompt, q.options, q.correct_index, q.points, q.sort_order, now(), now()
  from public.assessment_questions q
  where q.org_id = src
  on conflict (id) do nothing;

  -- Live sessions (forward-dated so they are registrable, not ended)
  insert into public.legend_live_sessions
    (id, org_id, title, description, host_id, host_name, kind, course_id, starts_at, duration_minutes, capacity, location, join_url, session_state, created_by, created_at, updated_at)
  select uuid_generate_v5(ns, 'session:'||s.id::text), dst, s.title, s.description, null, s.host_name, s.kind,
         case when s.course_id is null then null else uuid_generate_v5(ns, 'course:'||s.course_id::text) end,
         now() + interval '14 days', s.duration_minutes, s.capacity, s.location, s.join_url,
         'scheduled', null, now(), now()
  from public.legend_live_sessions s
  where s.org_id = src and s.deleted_at is null
  on conflict (id) do nothing;

  -- Vouchers (forward-dated expiry so they redeem)
  insert into public.vouchers
    (id, org_id, code, credits, max_redemptions, redeemed_count, expires_on, voucher_state, created_by, created_at, updated_at)
  select uuid_generate_v5(ns, 'voucher:'||v.id::text), dst, v.code, v.credits, v.max_redemptions, 0,
         (now() + interval '90 days')::date, 'active', null, now(), now()
  from public.vouchers v
  where v.org_id = src and v.deleted_at is null
  on conflict (id) do nothing;
end $$;
