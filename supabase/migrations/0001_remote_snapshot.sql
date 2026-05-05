


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE TYPE "public"."accreditation_state" AS ENUM (
    'applied',
    'vetting',
    'approved',
    'issued',
    'suspended',
    'revoked',
    'expired'
);


ALTER TYPE "public"."accreditation_state" OWNER TO "postgres";


CREATE TYPE "public"."annotation_kind" AS ENUM (
    'flag',
    'note',
    'comment',
    'tag'
);


ALTER TYPE "public"."annotation_kind" OWNER TO "postgres";


CREATE TYPE "public"."annotation_severity" AS ENUM (
    'info',
    'warning',
    'critical'
);


ALTER TYPE "public"."annotation_severity" OWNER TO "postgres";


CREATE TYPE "public"."annotation_status" AS ENUM (
    'open',
    'acknowledged',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."annotation_status" OWNER TO "postgres";


CREATE TYPE "public"."approval_state" AS ENUM (
    'pending',
    'signed',
    'declined',
    'expired'
);


ALTER TYPE "public"."approval_state" OWNER TO "postgres";


CREATE TYPE "public"."automation_run_status" AS ENUM (
    'pending',
    'running',
    'success',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."automation_run_status" OWNER TO "postgres";


CREATE TYPE "public"."change_order_state" AS ENUM (
    'draft',
    'requested',
    'priced',
    'client_review',
    'approved',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."change_order_state" OWNER TO "postgres";


CREATE TYPE "public"."compensation_basis" AS ENUM (
    'per_day',
    'per_show_day',
    'flat_fee',
    'hourly',
    'tbd'
);


ALTER TYPE "public"."compensation_basis" OWNER TO "postgres";


CREATE TYPE "public"."deliverable_status" AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'revision_requested'
);


ALTER TYPE "public"."deliverable_status" OWNER TO "postgres";


CREATE TYPE "public"."deliverable_type" AS ENUM (
    'technical_rider',
    'hospitality_rider',
    'input_list',
    'stage_plot',
    'crew_list',
    'guest_list',
    'equipment_pull_list',
    'power_plan',
    'rigging_plan',
    'site_plan',
    'build_schedule',
    'vendor_package',
    'safety_compliance',
    'comms_plan',
    'signage_grid',
    'custom'
);


ALTER TYPE "public"."deliverable_type" OWNER TO "postgres";


CREATE TYPE "public"."dispatch_fleet" AS ENUM (
    't1',
    't2',
    't3',
    'media',
    'workforce',
    'spectator'
);


ALTER TYPE "public"."dispatch_fleet" OWNER TO "postgres";


CREATE TYPE "public"."dsar_kind" AS ENUM (
    'access',
    'deletion',
    'correction',
    'portability',
    'objection'
);


ALTER TYPE "public"."dsar_kind" OWNER TO "postgres";


CREATE TYPE "public"."dsar_status" AS ENUM (
    'received',
    'verifying',
    'in_progress',
    'fulfilled',
    'rejected'
);


ALTER TYPE "public"."dsar_status" OWNER TO "postgres";


CREATE TYPE "public"."equipment_status" AS ENUM (
    'available',
    'reserved',
    'in_use',
    'maintenance',
    'retired'
);


ALTER TYPE "public"."equipment_status" OWNER TO "postgres";


CREATE TYPE "public"."event_status" AS ENUM (
    'draft',
    'scheduled',
    'live',
    'complete',
    'cancelled'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."expense_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'reimbursed'
);


ALTER TYPE "public"."expense_status" OWNER TO "postgres";


CREATE TYPE "public"."export_kind" AS ENUM (
    'csv',
    'json',
    'xlsx',
    'zip',
    'project_archive'
);


ALTER TYPE "public"."export_kind" OWNER TO "postgres";


CREATE TYPE "public"."export_status" AS ENUM (
    'pending',
    'running',
    'done',
    'failed'
);


ALTER TYPE "public"."export_status" OWNER TO "postgres";


CREATE TYPE "public"."guide_persona" AS ENUM (
    'artist',
    'vendor',
    'client',
    'sponsor',
    'guest',
    'crew',
    'staff',
    'custom'
);


ALTER TYPE "public"."guide_persona" OWNER TO "postgres";


CREATE TYPE "public"."handover_state" AS ENUM (
    'not_started',
    'inspection',
    'snag',
    'sign_off',
    'accepted',
    'closeout'
);


ALTER TYPE "public"."handover_state" OWNER TO "postgres";


CREATE TYPE "public"."import_job_state" AS ENUM (
    'pending',
    'parsing',
    'inserting',
    'success',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."import_job_state" OWNER TO "postgres";


CREATE TYPE "public"."incident_severity" AS ENUM (
    'near_miss',
    'minor',
    'major',
    'critical'
);


ALTER TYPE "public"."incident_severity" OWNER TO "postgres";


CREATE TYPE "public"."incident_status" AS ENUM (
    'open',
    'investigating',
    'resolved',
    'closed'
);


ALTER TYPE "public"."incident_status" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'voided'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."job_state" AS ENUM (
    'pending',
    'running',
    'done',
    'failed',
    'dead'
);


ALTER TYPE "public"."job_state" OWNER TO "postgres";


CREATE TYPE "public"."lead_stage" AS ENUM (
    'new',
    'qualified',
    'contacted',
    'proposal',
    'won',
    'lost'
);


ALTER TYPE "public"."lead_stage" OWNER TO "postgres";


CREATE TYPE "public"."offer_letter_classification" AS ENUM (
    'w2',
    '1099',
    'agency',
    'intern'
);


ALTER TYPE "public"."offer_letter_classification" OWNER TO "postgres";


CREATE TYPE "public"."offer_letter_employer" AS ENUM (
    'ghxstship',
    'five_senses',
    'joint'
);


ALTER TYPE "public"."offer_letter_employer" OWNER TO "postgres";


CREATE TYPE "public"."offer_letter_status" AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'declined',
    'withdrawn',
    'expired'
);


ALTER TYPE "public"."offer_letter_status" OWNER TO "postgres";


CREATE TYPE "public"."platform_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'member'
);


ALTER TYPE "public"."platform_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."platform_role" IS 'Org-level role (billing/governance). owner=billing+delete, admin=full org, manager=projects+people no billing, member=default.';



CREATE TYPE "public"."po_status" AS ENUM (
    'draft',
    'sent',
    'acknowledged',
    'fulfilled',
    'cancelled'
);


ALTER TYPE "public"."po_status" OWNER TO "postgres";


CREATE TYPE "public"."project_role" AS ENUM (
    'lead',
    'editor',
    'contributor',
    'viewer',
    'vendor'
);


ALTER TYPE "public"."project_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."project_role" IS 'Project-level role (operations). lead=PM, editor=team, contributor=crew/contractors, viewer=read-only, vendor=scoped POs.';



CREATE TYPE "public"."project_status" AS ENUM (
    'draft',
    'active',
    'paused',
    'archived',
    'complete'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_phase_status" AS ENUM (
    'locked',
    'active',
    'in_review',
    'approved',
    'complete'
);


ALTER TYPE "public"."proposal_phase_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_status" AS ENUM (
    'draft',
    'sent',
    'approved',
    'rejected',
    'expired',
    'signed'
);


ALTER TYPE "public"."proposal_status" OWNER TO "postgres";


CREATE TYPE "public"."raid_kind" AS ENUM (
    'risk',
    'assumption',
    'issue',
    'dependency'
);


ALTER TYPE "public"."raid_kind" OWNER TO "postgres";


CREATE TYPE "public"."record_role" AS ENUM (
    'viewer',
    'commenter',
    'assignee',
    'contributor',
    'editor',
    'full'
);


ALTER TYPE "public"."record_role" OWNER TO "postgres";


CREATE TYPE "public"."req_status" AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'converted'
);


ALTER TYPE "public"."req_status" OWNER TO "postgres";


CREATE TYPE "public"."revision_state" AS ENUM (
    'open',
    'client_review',
    'approved',
    'changes_requested',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."revision_state" OWNER TO "postgres";


CREATE TYPE "public"."risk_impact" AS ENUM (
    'insignificant',
    'minor',
    'moderate',
    'major',
    'severe'
);


ALTER TYPE "public"."risk_impact" OWNER TO "postgres";


CREATE TYPE "public"."risk_likelihood" AS ENUM (
    'rare',
    'unlikely',
    'possible',
    'likely',
    'almost_certain'
);


ALTER TYPE "public"."risk_likelihood" OWNER TO "postgres";


CREATE TYPE "public"."risk_status" AS ENUM (
    'open',
    'mitigating',
    'accepted',
    'closed'
);


ALTER TYPE "public"."risk_status" OWNER TO "postgres";


CREATE TYPE "public"."roster_state" AS ENUM (
    'draft',
    'published',
    'locked'
);


ALTER TYPE "public"."roster_state" OWNER TO "postgres";


CREATE TYPE "public"."share_link_role" AS ENUM (
    'viewer',
    'commenter'
);


ALTER TYPE "public"."share_link_role" OWNER TO "postgres";


CREATE TYPE "public"."shift_attendance" AS ENUM (
    'scheduled',
    'checked_in',
    'on_break',
    'checked_out',
    'no_show'
);


ALTER TYPE "public"."shift_attendance" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'review',
    'done'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'issued',
    'transferred',
    'scanned',
    'voided'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."tier" AS ENUM (
    'access',
    'core',
    'professional',
    'enterprise'
);


ALTER TYPE "public"."tier" OWNER TO "postgres";


COMMENT ON TYPE "public"."tier" IS 'Subscription tier (fbw_022): access (free) | core | professional | enterprise.';



CREATE TYPE "public"."venue_kind" AS ENUM (
    'competition',
    'training',
    'live_site',
    'ibc',
    'mpc',
    'village',
    'support'
);


ALTER TYPE "public"."venue_kind" OWNER TO "postgres";


CREATE TYPE "public"."vetting_state" AS ENUM (
    'pending',
    'in_progress',
    'clear',
    'flagged',
    'failed'
);


ALTER TYPE "public"."vetting_state" OWNER TO "postgres";


CREATE TYPE "public"."view_scope" AS ENUM (
    'private',
    'org',
    'public'
);


ALTER TYPE "public"."view_scope" OWNER TO "postgres";


CREATE TYPE "public"."view_type" AS ENUM (
    'grid',
    'kanban',
    'calendar',
    'timeline',
    'chart',
    'map',
    'gantt',
    'card',
    'form'
);


ALTER TYPE "public"."view_type" OWNER TO "postgres";


CREATE TYPE "public"."workforce_kind" AS ENUM (
    'paid_staff',
    'volunteer',
    'contractor',
    'official'
);


ALTER TYPE "public"."workforce_kind" OWNER TO "postgres";


CREATE TYPE "public"."xpms_edge_kind" AS ENUM (
    'assignment',
    'authorship',
    'provenance',
    'reference',
    'consumes',
    'produces'
);


ALTER TYPE "public"."xpms_edge_kind" OWNER TO "postgres";


CREATE TYPE "public"."xpms_geo_scope" AS ENUM (
    'local',
    'regional',
    'national',
    'international'
);


ALTER TYPE "public"."xpms_geo_scope" OWNER TO "postgres";


CREATE TYPE "public"."xpms_phase" AS ENUM (
    'discovery',
    'concept',
    'development',
    'advance',
    'build',
    'show',
    'strike',
    'wrap'
);


ALTER TYPE "public"."xpms_phase" OWNER TO "postgres";


CREATE TYPE "public"."xpms_production_style" AS ENUM (
    'editorial',
    'documentary',
    'narrative',
    'spectacle',
    'intimate',
    'brutalist'
);


ALTER TYPE "public"."xpms_production_style" OWNER TO "postgres";


CREATE TYPE "public"."xpms_state" AS ENUM (
    'uac',
    'tpc'
);


ALTER TYPE "public"."xpms_state" OWNER TO "postgres";


CREATE TYPE "public"."xpms_tier" AS ENUM (
    'social',
    'digital',
    'virtual',
    'physical',
    'experiential',
    'theatrical'
);


ALTER TYPE "public"."xpms_tier" OWNER TO "postgres";


CREATE TYPE "public"."xpms_tour_structure" AS ENUM (
    'single_stop',
    'multi_stop_sequential',
    'simultaneous_multi_city'
);


ALTER TYPE "public"."xpms_tour_structure" OWNER TO "postgres";


CREATE TYPE "public"."xpms_variance_reason" AS ENUM (
    'no_show',
    'substitution',
    'quantity_delta',
    'spec_change',
    'damage',
    'loss',
    'overtime',
    'weather',
    'client_change',
    'vendor_change',
    'other'
);


ALTER TYPE "public"."xpms_variance_reason" OWNER TO "postgres";


CREATE TYPE "public"."xtc_face" AS ENUM (
    'org',
    'finance',
    'both'
);


ALTER TYPE "public"."xtc_face" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."auth_org_ids"() RETURNS SETOF "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query select org_id from memberships where user_id = auth.uid();
end;
$$;


ALTER FUNCTION "private"."auth_org_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."auth_user_email"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  v text;
begin
  select email from auth.users where id = auth.uid() into v;
  return v;
end;
$$;


ALTER FUNCTION "private"."auth_user_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."effective_user_locale_settings"() RETURNS TABLE("locale" "text", "timezone" "text", "currency" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with u as (
    select locale, timezone, currency
    from user_preferences where user_id = auth.uid()
  ),
  o as (
    select default_locale, default_timezone, default_currency
    from orgs
    where id in (select org_id from memberships where user_id = auth.uid())
    order by created_at asc
    limit 1
  )
  select
    coalesce((select locale from u),   (select default_locale from o),   'en')   as locale,
    coalesce((select timezone from u), (select default_timezone from o), 'UTC')  as timezone,
    coalesce((select currency from u), (select default_currency from o), 'USD')  as currency;
$$;


ALTER FUNCTION "private"."effective_user_locale_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = target_org and role::text = any(required));
$$;


ALTER FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) IS 'RLS helper. SECURITY DEFINER + EXECUTE TO public is intentional — RLS evaluates as the calling role. Returns false when auth.uid() is null. Advisor warning accepted.';



CREATE OR REPLACE FUNCTION "private"."has_project_role"("target_project" "uuid", "required" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from project_members where project_id = target_project and user_id = auth.uid() and role::text = any(required))
  or exists (select 1 from projects p join memberships m on m.org_id = p.org_id
             where p.id = target_project and m.user_id = auth.uid() and m.role in ('owner','admin','manager'));
$$;


ALTER FUNCTION "private"."has_project_role"("target_project" "uuid", "required" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_org_admin"("target_org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = target_org and role in ('owner','admin'));
$$;


ALTER FUNCTION "private"."is_org_admin"("target_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_org_manager_plus"("target_org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = target_org and role in ('owner','admin','manager'));
$$;


ALTER FUNCTION "private"."is_org_manager_plus"("target_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_org_member"("target_org" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  match boolean;
begin
  select exists (select 1 from memberships where user_id = auth.uid() and org_id = target_org) into match;
  return match;
end;
$$;


ALTER FUNCTION "private"."is_org_member"("target_org" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."is_org_member"("target_org" "uuid") IS 'RLS helper. SECURITY DEFINER + EXECUTE TO public is intentional — RLS evaluates as the calling role; this fn must be callable from any policy. Returns false when auth.uid() is null. Advisor warning accepted.';



CREATE OR REPLACE FUNCTION "private"."is_project_member"("target_project" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from project_members where project_id = target_project and user_id = auth.uid())
  or exists (select 1 from projects p join memberships m on m.org_id = p.org_id
             where p.id = target_project and m.user_id = auth.uid() and m.role in ('owner','admin','manager'));
$$;


ALTER FUNCTION "private"."is_project_member"("target_project" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."proposal_org_id"("p_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v uuid;
begin
  select org_id into v from proposals where id = p_id;
  return v;
end;
$$;


ALTER FUNCTION "private"."proposal_org_id"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_offer_letter"("p_token" "uuid", "p_code" "text", "p_signature" "text", "p_ip" "inet", "p_user_agent" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_offer_letter"("p_token" "uuid", "p_code" "text", "p_signature" "text", "p_ip" "inet", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."annotations_notify"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor    uuid;
  v_user     uuid;
  v_href     text;
  v_title    text;
  v_body     text;
  v_root     uuid;
  v_mention  jsonb;
  v_mention_user uuid;
  v_creator_name text;
begin
  v_actor := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  v_root  := coalesce(new.parent_id, new.id);
  v_href  := '/console/annotations/' || v_root::text;

  if tg_op = 'INSERT' then
    if new.parent_id is not null then
      v_title := 'New reply on a flag';
      v_body  := left(new.body, 240);
    elsif new.confirmation_required then
      v_title := upper(new.severity::text) || ': confirmation required';
      v_body  := coalesce(new.title, left(new.body, 240));
    else
      v_title := initcap(new.kind::text) || ' — ' || upper(new.severity::text);
      v_body  := coalesce(new.title, left(new.body, 240));
    end if;

    if new.assigned_to is not null and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to, v_title, v_body, v_href);
    end if;

    for v_user in
      select distinct w.user_id
        from annotation_watchers w
       where w.annotation_id in (new.id, new.parent_id)
         and w.user_id is distinct from v_actor
         and w.user_id is distinct from coalesce(new.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid)
    loop
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, v_user, v_title, v_body, v_href);
    end loop;

    if new.created_by is not null then
      insert into annotation_watchers (annotation_id, user_id)
      values (coalesce(new.parent_id, new.id), new.created_by)
      on conflict do nothing;
    end if;

    if jsonb_typeof(new.metadata -> 'mentions') = 'array' then
      select coalesce(u.name, split_part(u.email, '@', 1), 'Someone')
        into v_creator_name
        from users u
       where u.id = new.created_by;
      v_creator_name := coalesce(v_creator_name, 'Someone');

      for v_mention in
        select * from jsonb_array_elements(new.metadata -> 'mentions')
      loop
        if (v_mention ->> 'kind') is distinct from 'user' then continue; end if;
        begin
          v_mention_user := (v_mention ->> 'id')::uuid;
        exception when others then
          continue;
        end;
        if v_mention_user is null then continue; end if;
        if v_mention_user is not distinct from v_actor then continue; end if;
        if v_mention_user is not distinct from new.assigned_to then continue; end if;

        insert into notifications (org_id, user_id, kind, title, body, href)
        values (
          new.org_id,
          v_mention_user,
          'mention.comment',
          v_creator_name || ' mentioned you in a ' || new.kind::text,
          left(coalesce(new.title, new.body), 240),
          v_href
        );
      end loop;
    end if;

    insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
    values (new.org_id, v_actor, 'annotation.created', 'annotations', new.id,
      jsonb_build_object(
        'kind', new.kind, 'severity', new.severity,
        'target_table', new.target_table, 'target_id', new.target_id,
        'parent_id', new.parent_id,
        'mentions', coalesce(new.metadata -> 'mentions', '[]'::jsonb)
      ));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status not in ('resolved', 'dismissed')
       and new.status in ('resolved', 'dismissed')
       and new.created_by is not null
       and new.created_by is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.created_by,
        'Flag ' || new.status::text,
        coalesce(new.resolution_note, coalesce(new.title, left(new.body, 240))),
        v_href);
    end if;

    if new.assigned_to is not null
       and old.assigned_to is distinct from new.assigned_to
       and new.assigned_to is distinct from v_actor then
      insert into notifications (org_id, user_id, title, body, href)
      values (new.org_id, new.assigned_to,
        'Flag assigned to you',
        coalesce(new.title, left(new.body, 240)),
        v_href);
    end if;

    if old.status is distinct from new.status
       or old.assigned_to is distinct from new.assigned_to
       or old.confirmed_at is distinct from new.confirmed_at then
      insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
      values (new.org_id, v_actor, 'annotation.updated', 'annotations', new.id,
        jsonb_build_object(
          'old_status', old.status, 'new_status', new.status,
          'old_assignee', old.assigned_to, 'new_assignee', new.assigned_to,
          'confirmed_at', new.confirmed_at
        ));
    end if;
    return new;
  end if;

  return new;
end $$;


ALTER FUNCTION "public"."annotations_notify"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  target_org uuid;
  target_id uuid;
begin
  -- Extract org_id if the row has one (domain tables all do, except line items).
  begin
    if TG_OP = 'DELETE' then
      execute format('select ($1).%I', 'org_id') using old into target_org;
      execute format('select ($1).%I', 'id') using old into target_id;
    else
      execute format('select ($1).%I', 'org_id') using new into target_org;
      execute format('select ($1).%I', 'id') using new into target_id;
    end if;
  exception when undefined_column then
    target_org := null;
    target_id := null;
  end;

  if target_org is null then return coalesce(new, old); end if;

  insert into audit_log (org_id, actor_id, action, target_table, target_id, metadata)
  values (
    target_org,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    target_id,
    case
      when TG_OP = 'DELETE' then jsonb_build_object('before', to_jsonb(old))
      when TG_OP = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
      else jsonb_build_object('after', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$_$;


ALTER FUNCTION "public"."audit_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_team_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select team_id from team_members where user_id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_team_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bump_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."bump_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_record"("p_table" "text", "p_id" "uuid", "p_op" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare v_role record_role;
begin
  v_role := record_role_for(p_table, p_id);
  if v_role is null then return false; end if;
  return case p_op
    when 'read'        then v_role >= 'viewer'
    when 'comment'     then v_role >= 'commenter'
    when 'edit'        then v_role >= 'contributor'
    when 'edit_others' then v_role >= 'editor'
    when 'delete'      then v_role >= 'editor'
    when 'admin'       then v_role  = 'full'
    else false
  end;
end $$;


ALTER FUNCTION "public"."can_record"("p_table" "text", "p_id" "uuid", "p_op" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."job_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "state" "public"."job_state" DEFAULT 'pending'::"public"."job_state" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locked_by" "text",
    "locked_until" timestamp with time zone,
    "last_error" "text",
    "dedup_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."job_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_queue" IS 'Background job queue (H3-02 / IK-027). Single table; dead-letter = state="dead".';



COMMENT ON COLUMN "public"."job_queue"."locked_until" IS 'Lease end. Another worker may claim after this timestamp even if locked_by is set.';



COMMENT ON COLUMN "public"."job_queue"."dedup_key" IS 'Optional — a second enqueue with matching (type, dedup_key) while status is pending/running is a no-op.';



CREATE OR REPLACE FUNCTION "public"."claim_jobs"("p_batch" integer, "p_visibility_s" integer, "p_worker" "text") RETURNS SETOF "public"."job_queue"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with batch as (
    select id from job_queue
    where state = 'pending' and run_at <= now()
    order by run_at
    for update skip locked
    limit p_batch
  )
  update job_queue j
  set state = 'running',
      attempts = attempts + 1,
      locked_by = p_worker,
      locked_until = now() + make_interval(secs => p_visibility_s)
  from batch
  where j.id = batch.id
  returning j.*;
$$;


ALTER FUNCTION "public"."claim_jobs"("p_batch" integer, "p_visibility_s" integer, "p_worker" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."share_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "resource_table" "text" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "role" "public"."share_link_role" DEFAULT 'viewer'::"public"."share_link_role" NOT NULL,
    "passcode_hash" "text",
    "expires_at" timestamp with time zone,
    "max_uses" integer,
    "uses" integer DEFAULT 0 NOT NULL,
    "label" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."share_links" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_share_link"("p_id" "uuid") RETURNS "public"."share_links"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_row share_links;
begin
  update share_links
     set uses = uses + 1, last_used_at = now()
   where id = p_id
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses)
   returning * into v_row;
  if v_row.id is null then raise exception 'share_link_invalid' using errcode = '42501'; end if;
  return v_row;
end $$;


ALTER FUNCTION "public"."consume_share_link"("p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."consume_share_link"("p_id" "uuid") IS 'Public share-link consumer. INTENTIONALLY callable by anon — the unauth /share/[token] route relies on this. Atomic UPDATE+RETURNING with predicates that gate revocation/expiry/exhaustion. SECURITY DEFINER required so callers without direct UPDATE on share_links can still advance the counter. Advisor warning accepted-by-design.';



CREATE OR REPLACE FUNCTION "public"."create_annotation"("p_org_id" "uuid", "p_project_id" "uuid", "p_target_table" "text", "p_target_id" "uuid", "p_kind" "public"."annotation_kind", "p_severity" "public"."annotation_severity", "p_title" "text", "p_body" "text", "p_tags" "text"[] DEFAULT '{}'::"text"[], "p_assigned_to" "uuid" DEFAULT NULL::"uuid", "p_due_at" "date" DEFAULT NULL::"date", "p_confirmation_required" boolean DEFAULT false, "p_created_by" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_id uuid;
begin
  insert into annotations (
    org_id, project_id, target_table, target_id, kind, severity,
    title, body, tags, assigned_to, due_at, confirmation_required, created_by
  ) values (
    p_org_id, p_project_id, p_target_table, p_target_id, p_kind, p_severity,
    p_title, p_body, p_tags, p_assigned_to, p_due_at, p_confirmation_required, p_created_by
  )
  returning id into v_id;
  return v_id;
end $$;


ALTER FUNCTION "public"."create_annotation"("p_org_id" "uuid", "p_project_id" "uuid", "p_target_table" "text", "p_target_id" "uuid", "p_kind" "public"."annotation_kind", "p_severity" "public"."annotation_severity", "p_title" "text", "p_body" "text", "p_tags" "text"[], "p_assigned_to" "uuid", "p_due_at" "date", "p_confirmation_required" boolean, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_request_id"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  return coalesce(current_setting('app.request_id', true), '');
end;
$$;


ALTER FUNCTION "public"."current_request_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_offer_letter"("p_token" "uuid", "p_code" "text", "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."decline_offer_letter"("p_token" "uuid", "p_code" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."emit_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_title" "text", "p_body" "text" DEFAULT NULL::"text", "p_href" "text" DEFAULT NULL::"text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_notification_id uuid;
  v_endpoint record;
begin
  if p_user_id is not null then
    insert into notifications (id, org_id, user_id, kind, title, body, href)
    values (gen_random_uuid(), p_org_id, p_user_id, p_event_type, p_title, p_body, p_href)
    returning id into v_notification_id;
  end if;

  for v_endpoint in
    select id from webhook_endpoints
     where org_id = p_org_id
       and is_active = true
       and deleted_at is null
       and (p_event_type = any(events) or '*' = any(events))
  loop
    insert into webhook_deliveries (endpoint_id, org_id, event_type, payload)
    values (
      v_endpoint.id,
      p_org_id,
      p_event_type,
      jsonb_build_object(
        'id', v_notification_id,
        'type', p_event_type,
        'title', p_title,
        'body', p_body,
        'href', p_href,
        'user_id', p_user_id,
        'occurred_at', now(),
        'data', p_payload
      )
    );
  end loop;

  return v_notification_id;
end;
$$;


ALTER FUNCTION "public"."emit_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_title" "text", "p_body" "text", "p_href" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_deliverable_deadline"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if new.status = 'submitted' and new.deadline is not null and now() > new.deadline then
    raise exception 'Cannot submit after deadline: %', new.deadline;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_deliverable_deadline"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_offer_access_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;


ALTER FUNCTION "public"."generate_offer_access_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_offer_letter_by_token"("p_token" "uuid", "p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_letter offer_letters;
  v_resolved jsonb;
  v_lifecycle jsonb;
begin
  select * into v_letter from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_letter.id is null then return null; end if;
  if v_letter.token_expires_at is not null and v_letter.token_expires_at < now() then return null; end if;
  if v_letter.status = 'withdrawn' then return null; end if;

  -- Lifecycle fields are *always* live (never frozen) so accept/decline/view
  -- state reflects current reality even on a sent or accepted letter.
  v_lifecycle := jsonb_build_object(
    'status', v_letter.status,
    'sent_at', v_letter.sent_at,
    'first_viewed_at', v_letter.first_viewed_at,
    'last_viewed_at', v_letter.last_viewed_at,
    'view_count', v_letter.view_count,
    'accepted_at', v_letter.accepted_at,
    'accepted_signature', v_letter.accepted_signature,
    'accepted_ip', v_letter.accepted_ip::text,
    'accepted_user_agent', v_letter.accepted_user_agent,
    'declined_at', v_letter.declined_at,
    'decline_reason', v_letter.decline_reason,
    'withdrawn_at', v_letter.withdrawn_at,
    'updated_at', v_letter.updated_at
  );

  if v_letter.snapshot is not null then
    -- Snapshot = frozen contract; lifecycle = live state. Merge so the
    -- snapshot's contract terms cannot drift but status accurately reflects
    -- view/accept/decline events that happened after the snapshot was taken.
    return v_letter.snapshot || v_lifecycle;
  end if;

  select to_jsonb(r.*) into v_resolved
    from offer_letters_resolved r where r.id = v_letter.id;
  return v_resolved;
end;
$$;


ALTER FUNCTION "public"."get_offer_letter_by_token"("p_token" "uuid", "p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_offer_letter_project_name"("p_token" "uuid", "p_code" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_offer_letter_project_name"("p_token" "uuid", "p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_email_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.users
     set email = new.email
   where id = new.id
     and email <> new.email;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_user_email_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_member"("p_team_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists(select 1 from team_members where team_id = p_team_id and user_id = auth.uid());
$$;


ALTER FUNCTION "public"."is_team_member"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_proposal_activity"("p_proposal_id" "uuid", "p_org_id" "uuid", "p_kind" "text", "p_actor_id" "uuid", "p_actor_label" "text" DEFAULT NULL::"text", "p_target_kind" "text" DEFAULT NULL::"text", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_summary" "text" DEFAULT ''::"text", "p_meta" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."log_proposal_activity"("p_proposal_id" "uuid", "p_org_id" "uuid", "p_kind" "text", "p_actor_id" "uuid", "p_actor_label" "text", "p_target_kind" "text", "p_target_id" "uuid", "p_summary" "text", "p_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_user uuid := auth.uid();
begin
  if p_id is null then
    raise exception 'mark_closed: id required';
  end if;

  case p_table
    when 'deliverables' then
      update public.deliverables
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'rfis' then
      update public.rfis
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'submittals' then
      update public.submittals
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'punch_items' then
      update public.punch_items
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    when 'incidents' then
      update public.incidents
         set closed_at = coalesce(closed_at, now()),
             closed_by = coalesce(closed_by, v_user),
             updated_at = now()
       where id = p_id;
    else
      raise exception 'mark_closed: table % not whitelisted', p_table;
  end case;
end
$$;


ALTER FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") IS 'Lifecycle terminator. SECURITY DEFINER + EXECUTE TO authenticated is intentional — table whitelist prevents arbitrary writes; RLS gates row visibility before this fn even runs. Advisor warning accepted-by-design.';



CREATE OR REPLACE FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_format text;
  v_next   bigint;
  v_year   text := to_char(now() at time zone 'utc', 'YYYY');
  v_yy     text := to_char(now() at time zone 'utc', 'YY');
  v_mm     text := to_char(now() at time zone 'utc', 'MM');
  v_dd     text := to_char(now() at time zone 'utc', 'DD');
  v_slug   text;
  v_out    text;
  v_match  text;
  v_width  int;
begin
  if not is_org_member(p_org_id) then
    raise exception 'org_member_required' using errcode = '42501';
  end if;

  insert into org_sequences as s (org_id, scope, current_val, format)
  values (p_org_id, p_scope, 1, coalesce(p_format, 'SEQ-{seq:04}'))
  on conflict (org_id, scope) do update
    set current_val = s.current_val + 1,
        format      = coalesce(p_format, s.format),
        updated_at  = now()
  returning current_val, format into v_next, v_format;

  select upper(slug) into v_slug from orgs where id = p_org_id;
  if v_slug is null then v_slug := 'ORG'; end if;

  v_out := v_format;
  v_out := replace(v_out, '{YYYY}', v_year);
  v_out := replace(v_out, '{YY}',   v_yy);
  v_out := replace(v_out, '{MM}',   v_mm);
  v_out := replace(v_out, '{DD}',   v_dd);
  v_out := replace(v_out, '{ORG}',  v_slug);

  loop
    v_match := substring(v_out from '\{seq:(\d+)\}');
    if v_match is null then exit; end if;
    v_width := v_match::int;
    v_out := regexp_replace(v_out, '\{seq:\d+\}', lpad(v_next::text, v_width, '0'));
  end loop;

  v_out := replace(v_out, '{seq}', lpad(v_next::text, 4, '0'));

  return v_out;
end;
$$;


ALTER FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text") IS 'Auto-Number sequence advancer. SECURITY DEFINER + EXECUTE TO authenticated is intentional — internal authorization is via is_org_member(p_org_id) which raises 42501 on cross-org calls. Advisor warning accepted-by-design.';



CREATE OR REPLACE FUNCTION "public"."peek_sequence"("p_org_id" "uuid", "p_scope" "text") RETURNS TABLE("current_val" bigint, "format" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select current_val, format
  from org_sequences
  where org_id = p_org_id and scope = p_scope;
$$;


ALTER FUNCTION "public"."peek_sequence"("p_org_id" "uuid", "p_scope" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."project_members_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."project_members_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."proposal_change_orders_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if new.number is null or new.number = 0 then
    select coalesce(max(number), 0) + 1
      into new.number
      from proposal_change_orders
      where proposal_id = new.proposal_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."proposal_change_orders_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reclaim_stuck_jobs"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with bumped as (
    update job_queue
    set state = 'pending', locked_by = null, locked_until = null
    where state = 'running' and locked_until < now()
    returning id
  )
  select count(*)::int from bumped;
$$;


ALTER FUNCTION "public"."reclaim_stuck_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_offer_letter_view"("p_token" "uuid", "p_code" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."record_offer_letter_view"("p_token" "uuid", "p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_role_for"("p_table" "text", "p_id" "uuid") RETURNS "public"."record_role"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select max(role) from record_grants
   where resource_table = p_table and resource_id = p_id
     and (expires_at is null or expires_at > now())
     and (user_id = auth.uid() or team_id in (select team_id from team_members where user_id = auth.uid()));
$$;


ALTER FUNCTION "public"."record_role_for"("p_table" "text", "p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_cornbread_abbey_road"("p_org_slug" "text" DEFAULT 'demo'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_org_id uuid;
  v_owner_id uuid;
  v_project_id uuid;
  v_client_id uuid;
  v_proposal_id uuid;
  v_phase_id uuid;
  v_co_id uuid;
  v_round_id uuid;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  if v_org_id is null then raise exception 'Org with slug % not found', p_org_slug; end if;

  select user_id into v_owner_id from memberships where org_id = v_org_id and role = 'owner' limit 1;

  insert into clients (org_id, name, contact_email, created_by)
    values (v_org_id, 'Cornbread Hemp', 'julian.clarkson@ghxstship.pro', v_owner_id)
    on conflict do nothing;
  select id into v_client_id from clients where org_id = v_org_id and name = 'Cornbread Hemp' limit 1;

  insert into projects (org_id, slug, name, description, status, start_date, end_date, client_id, created_by)
    values (
      v_org_id, 'cornbread-abbey-road',
      'Cornbread × Abbey Road on the River 2026',
      'Activation transport, install, and storage for Abbey Road on the River, Jeffersonville IN, May 21-25 2026.',
      'active', '2026-05-12', '2026-06-30', v_client_id, v_owner_id
    )
    on conflict (org_id, slug) do update set name = excluded.name, description = excluded.description
    returning id into v_project_id;

  delete from proposals where project_id = v_project_id;

  insert into proposals (org_id, project_id, client_id, title, amount_cents, status, sent_at, notes, created_by)
    values (
      v_org_id, v_project_id, v_client_id,
      'Cornbread × Abbey Road on the River 2026 — Activation Asset Management',
      1300500, 'sent', now() - interval '2 days',
      'CBH-ABR-2026-V1.0 — see lifecycle for delivery state.',
      v_owner_id
    )
    returning id into v_proposal_id;

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at, approved_at, approved_by)
    values (v_proposal_id, v_org_id, 1, 'discovery', 'Discovery & Creative Brief', 'complete', now() - interval '6 days', now() - interval '5 days', v_owner_id)
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done, done_at, done_by) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed creative brief with engagement parameters', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Confirmed venue access windows — May 19 and May 26', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Designated Cornbread representative assigned as PM counterpart', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Final planter count locked against vendor inventory', true, now() - interval '5 days', v_owner_id);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at)
    values (v_proposal_id, v_org_id, 2, 'concept', 'Concept Adaptation & Visualization', 'in_review', now() - interval '4 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Written approval of greenery palette', true),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Sign-off on lighting positions and timer schedule', true),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Confirmation of outdoor adaptation notes', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Approval to advance to engineering (2 business-day review window)', false);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at)
    values (v_proposal_id, v_org_id, 3, 'engineering', 'Engineering & Technical Development', 'active', now() - interval '2 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed load & power plan against venue drop', false),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Approved anchor specification for planter ring', false),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Weather contingency plan distributed to all parties', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'PE stamp obtained if required', false);

  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status) values
    (v_proposal_id, v_org_id, 4, 'fabrication',  'Fabrication & Procurement',         'locked'),
    (v_proposal_id, v_org_id, 5, 'logistics',    'Logistics & Pre-Deployment',        'locked'),
    (v_proposal_id, v_org_id, 6, 'installation', 'Installation & Environment Build',  'locked'),
    (v_proposal_id, v_org_id, 7, 'activation',   'Activation & Live Operations',      'locked'),
    (v_proposal_id, v_org_id, 8, 'legacy',       'Strike, Storage & Legacy',          'locked');

  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Add 2 planter boxes to ring',
      'Venue confirmed two additional planter positions adjacent to the activation face. Sourcing matched greenery and adding anchors.',
      51000, 'priced', v_owner_id, 'Julian Clarkson')
    returning id into v_co_id;

  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Time-lapse documentation deliverable',
      'Add the optional install-day time-lapse from Phase 06.', 48500, 'requested', v_owner_id, 'Julian Clarkson');

  insert into proposal_revision_rounds (proposal_id, org_id, target_kind, round_num, title, summary, state, created_by)
    values (v_proposal_id, v_org_id, 'phase', 2, 'Greenery palette mockups', '3 mockups for the planter ring — pick one or request changes.', 'client_review', v_owner_id)
    returning id into v_round_id;
  insert into proposal_revisions (round_id, proposal_id, org_id, ordinal, label, note) values
    (v_round_id, v_proposal_id, v_org_id, 1, 'Option A — Cornbread Orange forward', 'Hero botanical reads warm; trailing vine in cedar.'),
    (v_round_id, v_proposal_id, v_org_id, 2, 'Option B — Cannabis green forward', 'Higher contrast against orange wall; reads more growth.'),
    (v_round_id, v_proposal_id, v_org_id, 3, 'Option C — Mixed palette', 'Even split — most similar to existing brand mood boards.');

  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, due_at)
    values (v_proposal_id, v_org_id, 'phase_gate', 'Phase 02 — Concept Adaptation Sign-Off',
      'Approve the greenery palette and lighting design to advance to engineering.', 'pending', now() + interval '2 days');

  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, signed_at, signed_by, signed_label)
    values (v_proposal_id, v_org_id, 'sow', 'Master Statement of Work',
      'Counter-signed SOW for Cornbread × Abbey Road on the River 2026.', 'signed', now() - interval '4 days', v_owner_id, 'Julian Clarkson');

  insert into proposal_files (proposal_id, org_id, category, name, storage_path, size_bytes, mime_type, uploaded_by) values
    (v_proposal_id, v_org_id, 'sow', 'CBH-ABR-2026-SOW-V1.pdf', 'demo/cbh-abr-2026/sow-v1.pdf', 248320, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'proposal', 'CBH-ABR-2026-Proposal-V1.0.pdf', 'demo/cbh-abr-2026/proposal-v1.pdf', 412800, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'contract', 'GHXSTSHIP-MSA-V3.pdf', 'demo/cbh-abr-2026/msa-v3.pdf', 184320, 'application/pdf', v_owner_id);

  perform log_proposal_activity(v_proposal_id, v_org_id, 'proposal.sent', v_owner_id, 'GHXSTSHIP', 'proposal', v_proposal_id, 'Proposal V1.0 sent to client.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'sow.signed', v_owner_id, 'Cornbread Hemp', 'approval', v_proposal_id, 'Master SOW counter-signed.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.completed', v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 01 — Discovery & Creative Brief completed.', '{"phase_num":1}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 02 — Concept Adaptation entered review.', '{"phase_num":2}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 03 — Engineering & Technical Development started.', '{"phase_num":3}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'co.priced',       v_owner_id, 'GHXSTSHIP', 'change_order', v_co_id, 'Change order #1 priced — awaiting client decision.', '{"delta_cents":51000}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'rev.created',     v_owner_id, 'GHXSTSHIP', 'revision_round', v_round_id, 'Revision round opened — greenery palette mockups.', '{"round_num":2}');

  return v_proposal_id;
end;
$$;


ALTER FUNCTION "public"."seed_cornbread_abbey_road"("p_org_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_salvage_city_ssot"("p_org_slug" "text" DEFAULT 'demo'::"text") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_org_id uuid; v_project_id uuid; v_owner_id uuid;
  v_location_id uuid; v_venue_id uuid;
  v_julian_crew uuid; v_per_diem_rate uuid;
  v_count int := 0;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  select id into v_project_id from projects where org_id=v_org_id and slug='edclv26-salvage-city' limit 1;
  select user_id into v_owner_id from memberships where org_id=v_org_id and role='owner' limit 1;
  if v_org_id is null or v_project_id is null then raise exception 'Demo org or salvage city project missing.'; end if;

  insert into org_offer_letter_settings (org_id, default_payment_schedule, default_terms, default_inclusions, default_governing_law, default_employer)
  values (v_org_id,
    '60 % deposit on signature, 40 % balance on load-in',
    'Compensation paid on a 60 % deposit / 40 % balance on load-in basis unless otherwise noted. Travel and lodging arranged by the Five Senses logistics lead. Recipient agrees to comply with the Insomniac 2026 Safety & Social Media Policy and the GHXSTSHIP standard production rider. Confidential — not to be shared outside of the recipient and their direct counsel.',
    jsonb_build_array(
      'Production credentials and radio for the engagement window',
      'Boxed crew meals on call days',
      'On-site parking at Las Vegas Motor Speedway',
      'Coverage by the GHXSTSHIP general liability and workers comp policies'),
    'State of Florida', 'ghxstship')
  on conflict (org_id) do update set
    default_payment_schedule = excluded.default_payment_schedule,
    default_terms            = excluded.default_terms,
    default_inclusions       = excluded.default_inclusions,
    updated_at               = now();

  insert into locations (org_id, name, address, city, region, country, postcode)
  values (v_org_id, 'Las Vegas Motor Speedway', '7000 N Las Vegas Blvd', 'Las Vegas', 'NV', 'US', '89115')
  on conflict (org_id, name) do update set address=excluded.address, city=excluded.city, region=excluded.region;
  select id into v_location_id from locations where org_id=v_org_id and name='Las Vegas Motor Speedway' limit 1;

  insert into venues (org_id, project_id, location_id, name, kind, capacity)
  values (v_org_id, v_project_id, v_location_id, 'Nomads Land — Salvage City', 'live_site', 80)
  on conflict (org_id, project_id, name) do update set location_id=excluded.location_id, capacity=excluded.capacity;
  select id into v_venue_id from venues where org_id=v_org_id and project_id=v_project_id and name='Nomads Land — Salvage City' limit 1;

  insert into crew_members (org_id, user_id, name, email, phone, role, day_rate_cents)
  values (v_org_id, v_owner_id, 'Julian Clarkson', 'julian.clarkson@ghxstship.pro', '(407) 885-6011', 'Operations Director', 0)
  on conflict (org_id, lower(email)) do update set user_id=excluded.user_id, phone=excluded.phone, role=excluded.role;
  select id into v_julian_crew from crew_members where org_id=v_org_id and lower(email)='julian.clarkson@ghxstship.pro' limit 1;
  update org_offer_letter_settings set signing_authority_crew_member_id = v_julian_crew where org_id=v_org_id;

  with role_data(slug, label, department, description, responsibilities) as (values
    ('production-director',          'Production Director',                  'Production',  'Owns end-to-end production for Salvage City — schedule, crew, venue, vendor coordination, advancing, and final reconciliation.', jsonb_build_array('Hold the master schedule and run-of-show', 'Lead daily production briefings', 'Approve all departmental requisitions and POs against the project budget', 'Escalation point for production risk and incidents')),
    ('hospitality-manager',          'Hospitality Manager',                  'Hospitality', 'Owns floor flow, table management, and guest-facing service experience across all five seatings.', jsonb_build_array('Build and run the seating manifest in coordination with Ticket Fairy', 'Coordinate host/server staffing and pre-shift briefings', 'Walk every seating before doors and resolve guest issues in real time', 'Hand off the daysheet to Production at wrap')),
    ('production-manager-fb',        'Production Manager — F&B',             'Production',  'Manages the F&B production track — Levy, Chef Eyal Banayan, Crème by Me, and bar program coordination.', jsonb_build_array('Coordinate F&B advancing and BOH credentials', 'Support culinary and bar leads through load-in and service', 'Track allergen intake and incident reporting on each seating', 'Reconcile depletions and breakage nightly')),
    ('production-manager',           'Production Manager',                   'Production',  'Day-of production manager owning floor operations, crew assignments, and integration with technical departments.', jsonb_build_array('Run pre-show briefings and assign crew positions', 'Coordinate with R-Tech audio, 4Wall lighting, Paradox lighting design, and JTPro stage labor', 'Manage radio traffic on Channel 1', 'Own SOP execution and incident escalation')),
    ('credentials-travel-logistics', 'Credentials, Travel & Logistics',      'Logistics',   'Owns credentialing, travel booking, lodging, and per-diem coordination for the entire Salvage City team.', jsonb_build_array('Issue and track Insomniac credentials per crew', 'Book travel and lodging via Fan Experiences', 'Coordinate the Insomniac Safety & Social Media form for every team member', 'Maintain the master crew movement sheet')),
    ('finance-controller',           'Finance Controller',                   'Finance',     'Owns financial controls — invoicing, payroll, and expense reconciliation for the Salvage City production.', jsonb_build_array('Issue all crew invoices and process payroll', 'Track project budget against rate card', 'Reconcile vendor expenses and bar/F&B depletions', 'Close the project books within 30 days of strike')),
    ('executive-producer',           'Executive Producer',                   'Executive',   'Executive sponsor and final escalation for Salvage City production. Liaison between Five Senses, GHXSTSHIP, and Insomniac.', jsonb_build_array('Stakeholder communication with Insomniac executive team', 'Final approval on creative, F&B, and budget decisions', 'Final escalation point for safety, talent, and venue partner concerns')),
    ('production-crew-heavy',        'Production Crew — Heavy Equipment',    'Production',  'Operates heavy equipment (lifts, forklifts, telehandlers) during load-in, build, and strike.', jsonb_build_array('Operate forklift / lift equipment per OSHA certifications', 'Support trussing, decking, and large-format scenic install', 'Conduct daily equipment safety checks', 'Strike: load-out per the disposition plan')),
    ('production-crew-carpentry-av', 'Production Crew — Carpentry / AV',     'Production',  'Skilled carpentry and AV technical support during load-in, show, and strike.', jsonb_build_array('Support scenic carpentry, fixture install, and AV cabling', 'Daily safety checks of installed elements', 'Maintain crew tool inventory', 'Strike: load-out per the disposition plan')),
    ('production-assistant-driver',  'Production Assistant / Driver',         'Production',  'Production assistance and driver duties — runs, transport, and on-site support.', jsonb_build_array('On-site runs for production team', 'Driver for crew transport between hotel, venue, and outside vendors', 'Support PMs with floor logistics during show nights')),
    ('project-coordinator-remote',   'Project Coordinator (Remote)',         'Production',  'Remote project coordination — documentation, vendor follow-up, and pre-event advancing support.', jsonb_build_array('Track open advancing items in the production playbook', 'Maintain vendor communication and document file paths', 'Coordinate timezone-aware scheduling for production team meetings'))
  )
  insert into org_roles (org_id, slug, label, description, department, responsibilities, permissions, is_system)
  select v_org_id, slug, label, description, department, responsibilities, '{}'::text[], false from role_data
  on conflict (org_id, slug) do update set
    label=excluded.label, description=excluded.description, department=excluded.department, responsibilities=excluded.responsibilities;

  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  select v_org_id, 'crew_day_rates', 'CDR-' || r.slug, r.label || ' — Day Rate',
    'Per-day production crew rate for ' || r.label, 0, 'USD', true
   from org_roles r where r.org_id = v_org_id and r.slug = any (array[
     'production-director','hospitality-manager','production-manager-fb','production-manager',
     'credentials-travel-logistics','finance-controller','executive-producer',
     'production-crew-heavy','production-crew-carpentry-av','production-assistant-driver','project-coordinator-remote'])
  on conflict (org_id, sku) do update set name=excluded.name, description=excluded.description, active=excluded.active;

  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  values (v_org_id, 'crew_day_rates', 'PD-DAILY', 'Per Diem — Daily', 'Daily per diem for crew on travel days', 0, 'USD', true)
  on conflict (org_id, sku) do update set name=excluded.name;
  select id into v_per_diem_rate from rate_card_items where org_id=v_org_id and sku='PD-DAILY' limit 1;

  with crew_data(name, email, phone, role_slug) as (values
    ('Sarah Fry',              'frysarah8@gmail.com',           '(615) 708-3676', 'production-director'),
    ('Vida Sotakoun',          'vidasotakoun@gmail.com',        '(815) 298-8244', 'hospitality-manager'),
    ('Kade Barrett',           'kadebarrett808@icloud.com',     '(443) 735-8870', 'production-manager-fb'),
    ('Skylar Contini-Enneper', 'skylarenneper@gmail.com',       '(702) 689-6907', 'production-manager'),
    ('Corrine Lepere',         'corrinelepere@gmail.com',       '(845) 406-0261', 'production-manager'),
    ('Margo Williams',         'margo@five-senses.co',          null,             'credentials-travel-logistics'),
    ('Alvaro Hernandez',       'alvaro@five-senses.co',         null,             'finance-controller'),
    ('Paul Seigenthaler',      'paul.seigenthaler@insomniac.com','(856) 373-6541', 'executive-producer'),
    ('Brett Mosher',           'brett@ghxstship.pro',           null,             'production-crew-heavy'),
    ('Adam Waddle',            'adam@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Josh Parra',             'josh@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Mariah Williams',        'mariah@ghxstship.pro',          null,             'production-assistant-driver'),
    ('Amy Reed',               'amy@ghxstship.pro',             null,             'project-coordinator-remote')
  )
  insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
  select v_org_id, name, email, phone, role_slug, 0 from crew_data
  on conflict (org_id, lower(email)) do update set name=excluded.name, phone=excluded.phone, role=excluded.role;

  with letter_data(email, employer, reports_to_email) as (values
    ('frysarah8@gmail.com',           'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('vidasotakoun@gmail.com',        'five_senses', 'frysarah8@gmail.com'),
    ('kadebarrett808@icloud.com',     'five_senses', 'frysarah8@gmail.com'),
    ('skylarenneper@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('corrinelepere@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('margo@five-senses.co',          'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('alvaro@five-senses.co',         'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('paul.seigenthaler@insomniac.com','joint',      'julian.clarkson@ghxstship.pro'),
    ('brett@ghxstship.pro',           'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('adam@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('josh@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('mariah@ghxstship.pro',          'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('amy@ghxstship.pro',             'ghxstship',   'julian.clarkson@ghxstship.pro')
  )
  insert into offer_letters (org_id, project_id, crew_member_id, role_id, reports_to_crew_member_id,
    employer, classification, venue_id, rate_card_item_id, per_diem_rate_card_item_id,
    compensation_basis, access_code, token_expires_at, status, created_by)
  select v_org_id, v_project_id, cm.id, r.id, rt.id,
    ld.employer::offer_letter_employer, '1099'::offer_letter_classification, v_venue_id,
    rc.id, v_per_diem_rate, 'per_day'::compensation_basis,
    generate_offer_access_code(), now() + interval '60 days', 'draft', v_owner_id
  from letter_data ld
  join crew_members cm on cm.org_id=v_org_id and lower(cm.email)=lower(ld.email)
  join org_roles r on r.org_id=v_org_id and r.slug=cm.role
  left join crew_members rt on rt.org_id=v_org_id and lower(rt.email)=lower(ld.reports_to_email)
  left join rate_card_items rc on rc.org_id=v_org_id and rc.sku='CDR-' || cm.role
  on conflict (org_id, project_id, crew_member_id) do update set
    role_id=excluded.role_id, reports_to_crew_member_id=excluded.reports_to_crew_member_id,
    employer=excluded.employer, venue_id=excluded.venue_id,
    rate_card_item_id=excluded.rate_card_item_id, per_diem_rate_card_item_id=excluded.per_diem_rate_card_item_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
  select ol.id, v_org_id, 'created', 'GHXSTSHIP', 'Seeded as draft for the Salvage City team.'
    from offer_letters ol where ol.project_id = v_project_id
     and not exists (select 1 from offer_letter_activity a where a.offer_letter_id=ol.id and a.kind='created');

  select count(*) into v_count from offer_letters where project_id=v_project_id;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."seed_salvage_city_ssot"("p_org_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."service_request_set_sla"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  policy record;
begin
  if new.sla_response_due is null or new.sla_resolution_due is null then
    select response_minutes, resolution_minutes into policy
      from service_sla_policies
     where org_id = new.org_id
       and severity = new.severity
       and active = true
     limit 1;
    if found then
      if new.sla_response_due is null then
        new.sla_response_due := new.opened_at + make_interval(mins => policy.response_minutes);
      end if;
      if new.sla_resolution_due is null then
        new.sla_resolution_due := new.opened_at + make_interval(mins => policy.resolution_minutes);
      end if;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."service_request_set_sla"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."snapshot_deliverable_on_submit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if (old.status is distinct from new.status) and new.status = 'submitted' then
    new.version = old.version + 1;
    new.submitted_at = now();
    insert into deliverable_history (deliverable_id, version, data, changed_by)
    values (new.id, new.version, new.data, coalesce(new.submitted_by, old.submitted_by, auth.uid()));
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."snapshot_deliverable_on_submit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."snapshot_offer_letter"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if (OLD.status = 'draft' and NEW.status <> 'draft') and NEW.snapshot is null then
    select to_jsonb(r.*) into NEW.snapshot
      from offer_letters_resolved r
      where r.id = NEW.id;
    NEW.snapshot_at := now();
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."snapshot_offer_letter"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_budget_for_bucket"("p_org_id" "uuid", "p_project_id" "uuid", "p_category" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_expense_total bigint;
  v_invoice_total bigint;
  v_total bigint;
begin
  select coalesce(sum(amount_cents), 0) into v_expense_total
  from expenses
  where org_id = p_org_id
    and (p_project_id is null or project_id = p_project_id)
    and (p_category   is null or category   = p_category);

  select coalesce(sum(amount_cents), 0) into v_invoice_total
  from invoices
  where org_id = p_org_id
    and status = 'paid'
    and (p_project_id is null or project_id = p_project_id);

  v_total := v_expense_total + v_invoice_total;

  update budgets
  set spent_cents = v_total
  where org_id = p_org_id
    and (project_id = p_project_id or (project_id is null and p_project_id is null))
    and (category   = p_category   or (category   is null and p_category   is null));
end;
$$;


ALTER FUNCTION "public"."sync_budget_for_bucket"("p_org_id" "uuid", "p_project_id" "uuid", "p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_budget_for_bucket"("p_org_id" "uuid", "p_project_id" "uuid", "p_category" "text") IS '3NF SSOT: recomputes budgets.spent_cents from live expenses + paid invoices. Authoritative — do not mutate budgets.spent_cents from application code.';



CREATE OR REPLACE FUNCTION "public"."tg_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_org_id uuid;
  v_row_id uuid;
  v_actor uuid;
  v_email text;
begin
  if tg_op = 'DELETE' then
    v_org_id := (to_jsonb(old) ->> 'org_id')::uuid;
    v_row_id := (to_jsonb(old) ->> 'id')::uuid;
  else
    v_org_id := (to_jsonb(new) ->> 'org_id')::uuid;
    v_row_id := (to_jsonb(new) ->> 'id')::uuid;
  end if;

  if v_org_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  v_actor := auth.uid();
  select email into v_email from auth.users where id = v_actor;

  insert into audit_log (
    org_id, actor_id, actor_email, action, operation,
    target_table, target_id, before, after, request_id, metadata
  ) values (
    v_org_id,
    v_actor,
    v_email,
    tg_table_name || '.' || lower(tg_op),
    lower(tg_op),
    tg_table_name,
    v_row_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,
    current_request_id(),
    jsonb_build_object('schema', tg_table_schema)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;


ALTER FUNCTION "public"."tg_audit_log"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."tg_audit_log"() IS 'SSOT writer for audit_log. Attached to every tenant table. Do not log to audit_log from application code.';



CREATE OR REPLACE FUNCTION "public"."tg_check_vendor_compliance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_vendor vendors%rowtype;
begin
  if new.vendor_id is null then return new; end if;
  if new.status not in ('sent','acknowledged','fulfilled') then return new; end if;
  if tg_op = 'UPDATE' and old.status = new.status and old.vendor_id is not distinct from new.vendor_id then
    return new;
  end if;

  select * into v_vendor from vendors where id = new.vendor_id;
  if not found then return new; end if;

  if not coalesce(v_vendor.w9_on_file, false) then
    raise exception 'Vendor "%" missing W-9; PO blocked. Update vendor record before binding.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  if v_vendor.coi_expires_at is null or v_vendor.coi_expires_at < current_date then
    raise exception 'Vendor "%" COI expired or missing; PO blocked. Refresh insurance certificate.', v_vendor.name
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_check_vendor_compliance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_compute_time_entry_duration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if new.ended_at is not null and new.started_at is not null then
    new.duration_minutes := round(
      extract(epoch from (new.ended_at - new.started_at)) / 60.0
    )::int;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_compute_time_entry_duration"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."tg_compute_time_entry_duration"() IS '3NF SSOT: derives time_entries.duration_minutes from (ended_at - started_at). Manual duration_minutes preserved when ended_at is null. Do not set duration_minutes explicitly when ended_at is present.';



CREATE OR REPLACE FUNCTION "public"."tg_dashboards_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_dashboards_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_import_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_import_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_project_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_project_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."tg_set_updated_at"() IS 'Maintains updated_at on every business table. Do not set updated_at from application code.';



CREATE OR REPLACE FUNCTION "public"."tg_share_links_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_share_links_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_budget_spent_on_expense"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_org_id uuid;
  v_project_id uuid;
  v_category text;
begin
  if tg_op = 'DELETE' then
    v_org_id     := old.org_id;
    v_project_id := old.project_id;
    v_category   := old.category;
  else
    v_org_id     := new.org_id;
    v_project_id := new.project_id;
    v_category   := new.category;
  end if;

  perform sync_budget_for_bucket(v_org_id, v_project_id, v_category);

  if tg_op = 'UPDATE' then
    if old.project_id is distinct from new.project_id or old.category is distinct from new.category then
      perform sync_budget_for_bucket(old.org_id, old.project_id, old.category);
    end if;
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."tg_sync_budget_spent_on_expense"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_budget_spent_on_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'DELETE' and old.status = 'paid' then
    perform sync_budget_for_bucket(old.org_id, old.project_id, null);
  elsif tg_op = 'INSERT' and new.status = 'paid' then
    perform sync_budget_for_bucket(new.org_id, new.project_id, null);
  elsif tg_op = 'UPDATE' and (old.status = 'paid' or new.status = 'paid') then
    perform sync_budget_for_bucket(new.org_id, new.project_id, null);
    if old.project_id is distinct from new.project_id then
      perform sync_budget_for_bucket(old.org_id, old.project_id, null);
    end if;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."tg_sync_budget_spent_on_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_teams_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_teams_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_view_configs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."tg_view_configs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."xpms_build_identifier"("p_org_token" "text", "p_event_token" "text", "p_event_year" smallint, "p_venue_token" "text", "p_class" smallint, "p_division" smallint, "p_section" smallint, "p_zone_token" "text", "p_sequence_no" integer, "p_revision" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select format(
    '%s-%s%s%s-%s.%s.%s-%s-%s%s',
    upper(p_org_token),
    upper(p_event_token),
    lpad(p_event_year::text, 2, '0'),
    upper(p_venue_token),
    p_class::text,
    p_division::text,
    p_section::text,
    upper(p_zone_token),
    lpad(p_sequence_no::text, 4, '0'),
    upper(p_revision)
  );
$$;


ALTER FUNCTION "public"."xpms_build_identifier"("p_org_token" "text", "p_event_token" "text", "p_event_year" smallint, "p_venue_token" "text", "p_class" smallint, "p_division" smallint, "p_section" smallint, "p_zone_token" "text", "p_sequence_no" integer, "p_revision" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "accreditation_id" "uuid",
    "venue_id" "uuid",
    "zone_id" "uuid",
    "gate_code" "text",
    "result" "text" NOT NULL,
    "reason" "text",
    "scanned_by" "uuid",
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "device_id" "text"
);


ALTER TABLE "public"."access_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accommodation_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "property" "text" NOT NULL,
    "city" "text",
    "stakeholder_group" "text",
    "rooms_reserved" integer DEFAULT 0 NOT NULL,
    "rooms_confirmed" integer DEFAULT 0 NOT NULL,
    "starts_on" "date",
    "ends_on" "date",
    "contract_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accommodation_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accreditation_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "description" "text",
    "zone_privileges" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accreditation_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accreditation_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "accreditation_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "requested_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "decided_by" "uuid",
    "decided_at" timestamp with time zone,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accreditation_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accreditations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "person_name" "text" NOT NULL,
    "person_email" "text",
    "user_id" "uuid",
    "delegation_id" "uuid",
    "category_id" "uuid",
    "state" "public"."accreditation_state" DEFAULT 'applied'::"public"."accreditation_state" NOT NULL,
    "vetting" "public"."vetting_state" DEFAULT 'pending'::"public"."vetting_state" NOT NULL,
    "card_barcode" "text",
    "valid_from" "date",
    "valid_to" "date",
    "issued_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoke_reason" "text",
    "photo_path" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accreditations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_manifests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "text" DEFAULT 'arrival'::"text" NOT NULL,
    "flight_ref" "text",
    "carrier" "text",
    "scheduled_at" timestamp with time zone,
    "actual_at" timestamp with time zone,
    "party_size" integer DEFAULT 1 NOT NULL,
    "delegation_id" "uuid",
    "notes" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ad_manifests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_column" "text" NOT NULL,
    "source_columns" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "prompt_template" "text" NOT NULL,
    "output_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "auto_refresh" boolean DEFAULT true NOT NULL,
    "model" "text" DEFAULT 'claude-sonnet-4-6'::"text" NOT NULL,
    "max_tokens" integer DEFAULT 256 NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New conversation'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text", 'tool'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annotation_watchers" (
    "annotation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."annotation_watchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "target_table" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "kind" "public"."annotation_kind" DEFAULT 'flag'::"public"."annotation_kind" NOT NULL,
    "severity" "public"."annotation_severity" DEFAULT 'info'::"public"."annotation_severity" NOT NULL,
    "status" "public"."annotation_status" DEFAULT 'open'::"public"."annotation_status" NOT NULL,
    "title" "text",
    "body" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "confirmation_required" boolean DEFAULT false NOT NULL,
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "due_at" "date",
    "assigned_to" "uuid",
    "linked_task_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_note" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "annotations_confirmation_consistency" CHECK ((("confirmation_required" = false) OR (("confirmation_required" = true) AND (("confirmed_at" IS NULL) OR ("confirmed_by" IS NOT NULL))))),
    CONSTRAINT "annotations_resolution_consistency" CHECK (((("status" = ANY (ARRAY['resolved'::"public"."annotation_status", 'dismissed'::"public"."annotation_status"])) AND ("resolved_at" IS NOT NULL)) OR (("status" <> ALL (ARRAY['resolved'::"public"."annotation_status", 'dismissed'::"public"."annotation_status"])) AND ("resolved_at" IS NULL))))
);


ALTER TABLE "public"."annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "prefix" "text" NOT NULL,
    "hashed_secret" "text" NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "asset_kind" "text" NOT NULL,
    "asset_serial" "text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "asset_links_asset_kind_check" CHECK (("asset_kind" = ANY (ARRAY['nfc_tag'::"text", 'rfid_card'::"text", 'barcode'::"text", 'qr_code'::"text"])))
);


ALTER TABLE "public"."asset_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "target_table" "text",
    "target_id" "uuid",
    "metadata" "jsonb",
    "at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "operation" "text",
    "before" "jsonb",
    "after" "jsonb",
    "request_id" "text",
    "actor_email" "text"
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automation_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "trigger_kind" "text" NOT NULL,
    "trigger_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "triggered_by" "uuid",
    "status" "public"."automation_run_status" DEFAULT 'pending'::"public"."automation_run_status" NOT NULL,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "error_summary" "text",
    "action_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "automation_id" "uuid" NOT NULL,
    "rrule" "text" NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "next_run_at" timestamp with time zone NOT NULL,
    "last_run_at" timestamp with time zone,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automation_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_step_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "step_index" integer NOT NULL,
    "action_type" "text" NOT NULL,
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error" "text",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "latency_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automation_step_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "automation_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "source_table" "text",
    "source_id" "uuid",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automation_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_kind" "text" DEFAULT 'manual'::"text" NOT NULL,
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "last_run_at" timestamp with time zone,
    "last_run_status" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "webhook_secret" "text",
    CONSTRAINT "automations_trigger_kind_check" CHECK (("trigger_kind" = ANY (ARRAY['manual'::"text", 'schedule'::"text", 'webhook'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text",
    "amount_cents" bigint DEFAULT 0 NOT NULL,
    "spent_cents" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code" "text",
    "committed_cents" bigint DEFAULT 0 NOT NULL,
    "forecast_cents" bigint DEFAULT 0 NOT NULL,
    "eac_cents" bigint DEFAULT 0 NOT NULL,
    "notes" "text",
    "xtc_code" integer
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "channel" "text" DEFAULT 'multi'::"text" NOT NULL,
    "kind" "text" DEFAULT 'awareness'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "starts_on" "date",
    "ends_on" "date",
    "budget_cents" integer DEFAULT 0 NOT NULL,
    "spent_cents" integer DEFAULT 0 NOT NULL,
    "owner_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'live'::"text", 'paused'::"text", 'complete'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_studies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "customer_name" "text" NOT NULL,
    "hero_image_path" "text",
    "industry" "text",
    "format" "text",
    "region" "text",
    "challenge" "text",
    "solution" "text",
    "outcomes" "text",
    "metrics" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "quote_text" "text",
    "quote_author" "text",
    "quote_role" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."case_studies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "website" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "purpose" "text" NOT NULL,
    "granted" boolean DEFAULT false NOT NULL,
    "version" "text",
    "granted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."consent_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "body" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversation_messages_body_check" CHECK (("length"("body") > 0))
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversations_record_type_check" CHECK (("record_type" = ANY (ARRAY['project'::"text", 'purchase_order'::"text", 'requisition'::"text", 'rfq'::"text", 'rfi'::"text", 'submittal'::"text", 'punch_item'::"text", 'inspection'::"text", 'daily_log'::"text", 'site_plan'::"text", 'vendor'::"text", 'client'::"text", 'proposal'::"text", 'deliverable'::"text", 'incident'::"text", 'task'::"text", 'event'::"text", 'ticket'::"text", 'invoice'::"text", 'payment_application'::"text", 'po_change_order'::"text", 'work_order_broadcast'::"text", 'safety_briefing'::"text", 'prequalification'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xtc_code" integer
);


ALTER TABLE "public"."cost_codes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cost_codes"."xtc_code" IS 'Cross-reference to canonical XTC line item.';



CREATE TABLE IF NOT EXISTS "public"."credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "crew_member_id" "uuid",
    "kind" "text" NOT NULL,
    "number" "text",
    "issued_on" "date",
    "expires_on" "date",
    "file_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crew_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "role" "text",
    "phone" "text",
    "email" "text",
    "day_rate_cents" bigint,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xpms_atom_id" "uuid",
    "xtc_code" integer
);


ALTER TABLE "public"."crew_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."crew_members"."xpms_atom_id" IS 'Canonical XPMS atom for this crew member. Atom is the SSOT.';



CREATE TABLE IF NOT EXISTS "public"."crisis_alert_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "alert_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "delivered_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone,
    "channel" "text"
);


ALTER TABLE "public"."crisis_alert_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crisis_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "channels" "jsonb" DEFAULT '["push"]'::"jsonb" NOT NULL,
    "audience" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crisis_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "scheduled_at" timestamp with time zone NOT NULL,
    "lane" "text" DEFAULT 'show'::"text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "owner_id" "uuid",
    "duration_seconds" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cues_lane_check" CHECK (("lane" = ANY (ARRAY['show'::"text", 'lights'::"text", 'audio'::"text", 'video'::"text", 'talent'::"text", 'safety'::"text", 'transport'::"text"]))),
    CONSTRAINT "cues_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'standby'::"text", 'live'::"text", 'done'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."cues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_log_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "daily_log_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "description" "text" NOT NULL,
    "arrived_at" timestamp with time zone,
    "received_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_log_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_log_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "daily_log_id" "uuid" NOT NULL,
    "equipment_id" "uuid",
    "description" "text",
    "hours_used" numeric DEFAULT 0 NOT NULL,
    "hours_idle" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_log_equipment_hours_idle_check" CHECK (("hours_idle" >= (0)::numeric)),
    CONSTRAINT "daily_log_equipment_hours_used_check" CHECK (("hours_used" >= (0)::numeric))
);


ALTER TABLE "public"."daily_log_equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_log_manpower" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "daily_log_id" "uuid" NOT NULL,
    "trade" "text" NOT NULL,
    "vendor_id" "uuid",
    "headcount" integer NOT NULL,
    "hours_worked" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_log_manpower_headcount_check" CHECK (("headcount" >= 0)),
    CONSTRAINT "daily_log_manpower_hours_worked_check" CHECK (("hours_worked" >= (0)::numeric))
);


ALTER TABLE "public"."daily_log_manpower" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_log_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "daily_log_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "caption" "text",
    "taken_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "taken_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_log_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_log_visitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "daily_log_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "organization" "text",
    "purpose" "text",
    "arrived_at" timestamp with time zone,
    "departed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_log_visitors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "weather_summary" "text",
    "weather_temp_high_f" numeric,
    "weather_temp_low_f" numeric,
    "weather_precip_in" numeric,
    "weather_wind_mph" numeric,
    "weather_source" "text",
    "notes" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "submitted_by" "uuid",
    "submitted_at" timestamp with time zone,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_logs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text"])))
);


ALTER TABLE "public"."daily_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "layout" "jsonb" DEFAULT '{"gap": 16, "cols": 12, "widgets": []}'::"jsonb" NOT NULL,
    "scope" "public"."view_scope" DEFAULT 'private'::"public"."view_scope" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delegation_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "delegation_id" "uuid" NOT NULL,
    "discipline" "text",
    "event" "text",
    "participant_name" "text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delegation_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delegations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "country" "text",
    "attache_user_id" "uuid",
    "contact_email" "text",
    "contact_phone" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delegations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliverable_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deliverable_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deliverable_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliverable_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deliverable_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "data" "jsonb" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deliverable_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliverable_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "type" "public"."deliverable_type" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_global" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."deliverable_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."deliverable_templates" IS 'Rider / plot template catalog (Opp #12).';



CREATE TABLE IF NOT EXISTS "public"."deliverables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" "public"."deliverable_type" NOT NULL,
    "title" "text",
    "status" "public"."deliverable_status" DEFAULT 'draft'::"public"."deliverable_status" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "file_path" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "submitted_by" "uuid",
    "reviewed_by" "uuid",
    "submitted_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "closed_by" "uuid"
);


ALTER TABLE "public"."deliverables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispatch_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "fleet" "public"."dispatch_fleet" DEFAULT 't1'::"public"."dispatch_fleet" NOT NULL,
    "vehicle_ref" "text",
    "driver_id" "uuid",
    "origin_venue_id" "uuid",
    "destination_venue_id" "uuid",
    "scheduled_depart" timestamp with time zone NOT NULL,
    "scheduled_arrive" timestamp with time zone,
    "actual_depart" timestamp with time zone,
    "actual_arrive" timestamp with time zone,
    "manifest" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dispatch_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domain_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_table" "text",
    "source_id" "uuid",
    "emitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dispatched_at" timestamp with time zone
);


ALTER TABLE "public"."domain_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dsar_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "requester_user_id" "uuid",
    "requester_email" "text" NOT NULL,
    "kind" "public"."dsar_kind" DEFAULT 'access'::"public"."dsar_kind" NOT NULL,
    "status" "public"."dsar_status" DEFAULT 'received'::"public"."dsar_status" NOT NULL,
    "identity_verified" boolean DEFAULT false NOT NULL,
    "due_by" "date",
    "fulfilled_at" timestamp with time zone,
    "payload_path" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dsar_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "body_text" "text",
    "merge_tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_templates" IS 'Per-org transactional email template catalog (Opp #21).';



CREATE TABLE IF NOT EXISTS "public"."environmental_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid",
    "kind" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "reading" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."environmental_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "asset_tag" "text",
    "serial" "text",
    "status" "public"."equipment_status" DEFAULT 'available'::"public"."equipment_status" NOT NULL,
    "location_id" "uuid",
    "daily_rate_cents" bigint,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "xpms_atom_id" "uuid",
    "xtc_code" integer
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."equipment"."xpms_atom_id" IS 'Canonical XPMS atom for this equipment unit. Atom is the SSOT.';



CREATE TABLE IF NOT EXISTS "public"."event_guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "persona" "public"."guide_persona" NOT NULL,
    "tier" integer DEFAULT 5 NOT NULL,
    "classification" "text",
    "slug" "text",
    "title" "text" NOT NULL,
    "subtitle" "text",
    "published" boolean DEFAULT false NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "event_guides_tier_check" CHECK ((("tier" >= 1) AND ("tier" <= 9)))
);


ALTER TABLE "public"."event_guides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "name" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "location_id" "uuid",
    "status" "public"."event_status" DEFAULT 'draft'::"public"."event_status" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "submitter_id" "uuid" NOT NULL,
    "category" "text",
    "description" "text" NOT NULL,
    "amount_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "public"."expense_status" DEFAULT 'pending'::"public"."expense_status" NOT NULL,
    "receipt_path" "text",
    "spent_at" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xtc_code" integer,
    "atom_id" "uuid"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "public"."export_kind" NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "public"."export_status" DEFAULT 'pending'::"public"."export_status" NOT NULL,
    "file_path" "text",
    "size_bytes" bigint,
    "row_count" bigint,
    "requested_by" "uuid",
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."export_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."export_runs" IS 'Unified export history. Opportunity #8 — kinds: csv, json, xlsx, zip, project_archive.';



CREATE TABLE IF NOT EXISTS "public"."fabrication_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "due_at" "date",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xpms_atom_id" "uuid",
    "xtc_code" integer,
    CONSTRAINT "fabrication_orders_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'blocked'::"text", 'complete'::"text"])))
);


ALTER TABLE "public"."fabrication_orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fabrication_orders"."xpms_atom_id" IS 'Canonical XPMS atom for this fab order. Atom is the SSOT.';



CREATE TABLE IF NOT EXISTS "public"."form_defs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "schema" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_defs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."form_defs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitter_email" "text",
    "submitter_ip" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_submissions" IS 'Payloads collected from published /forms/[slug] pages. RLS: anon insert (gated app-side by status=published), org-member select.';



CREATE OR REPLACE VIEW "public"."gdpr_user_expenses" WITH ("security_invoker"='true') AS
 SELECT "id",
    "org_id",
    "project_id",
    "submitter_id",
    "category",
    "description",
    "amount_cents",
    "currency",
    "status",
    "receipt_path",
    "spent_at",
    "created_at",
    "updated_at",
    "xtc_code",
    "atom_id"
   FROM "public"."expenses"
  WHERE ("submitter_id" = ( SELECT "auth"."uid"() AS "uid"));


ALTER VIEW "public"."gdpr_user_expenses" OWNER TO "postgres";


COMMENT ON VIEW "public"."gdpr_user_expenses" IS 'GDPR Art.20 — expenses submitted by the caller. Read by /api/v1/me/export.';



CREATE TABLE IF NOT EXISTS "public"."mileage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "origin" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "miles" numeric NOT NULL,
    "rate_cents" bigint DEFAULT 67 NOT NULL,
    "logged_on" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mileage_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."gdpr_user_mileage_logs" WITH ("security_invoker"='true') AS
 SELECT "id",
    "org_id",
    "project_id",
    "user_id",
    "origin",
    "destination",
    "miles",
    "rate_cents",
    "logged_on",
    "notes",
    "created_at",
    "updated_at"
   FROM "public"."mileage_logs"
  WHERE ("user_id" = ( SELECT "auth"."uid"() AS "uid"));


ALTER VIEW "public"."gdpr_user_mileage_logs" OWNER TO "postgres";


COMMENT ON VIEW "public"."gdpr_user_mileage_logs" IS 'GDPR Art.20 — mileage logs owned by the caller. Read by /api/v1/me/export.';



CREATE TABLE IF NOT EXISTS "public"."time_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "description" "text",
    "started_at" timestamp with time zone NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_minutes" integer,
    "billable" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cost_code_id" "uuid",
    "rate_cents" bigint,
    "xtc_code" integer,
    "atom_id" "uuid"
);


ALTER TABLE "public"."time_entries" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."gdpr_user_time_entries" WITH ("security_invoker"='true') AS
 SELECT "id",
    "org_id",
    "project_id",
    "user_id",
    "description",
    "started_at",
    "ended_at",
    "duration_minutes",
    "billable",
    "created_at",
    "updated_at",
    "cost_code_id",
    "rate_cents",
    "xtc_code",
    "atom_id"
   FROM "public"."time_entries"
  WHERE ("user_id" = ( SELECT "auth"."uid"() AS "uid"));


ALTER VIEW "public"."gdpr_user_time_entries" OWNER TO "postgres";


COMMENT ON VIEW "public"."gdpr_user_time_entries" IS 'GDPR Art.20 — time entries owned by the caller. Read by /api/v1/me/export.';



CREATE TABLE IF NOT EXISTS "public"."governance_committees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "charter" "text",
    "cadence" "text",
    "chair_user_id" "uuid",
    "members" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."governance_committees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."governance_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "body" "text",
    "effective_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "next_review_at" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "owner_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "governance_policies_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."governance_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guard_tours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "venue_id" "uuid",
    "route" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cadence_minutes" integer,
    "next_run_at" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "guard_id" "uuid",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "guard_tours_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."guard_tours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guide_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "guide_id" "uuid" NOT NULL,
    "section_key" "text",
    "parent_id" "uuid",
    "author_user_id" "uuid",
    "author_name" "text",
    "author_email" "text",
    "body" "text" NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."guide_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idempotency_keys" (
    "key" "text" NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "method" "text" NOT NULL,
    "path" "text" NOT NULL,
    "request_hash" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "response" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL
);


ALTER TABLE "public"."idempotency_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."idempotency_keys" IS 'Stripe-style idempotency — dedupes mutating POST/PUT/PATCH/DELETE for 24h. Key is client-supplied via Idempotency-Key header.';



CREATE TABLE IF NOT EXISTS "public"."import_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "resource" "text" NOT NULL,
    "source" "text" DEFAULT 'csv'::"text" NOT NULL,
    "source_label" "text",
    "storage_path" "text",
    "state" "public"."import_job_state" DEFAULT 'pending'::"public"."import_job_state" NOT NULL,
    "rows_total" integer DEFAULT 0 NOT NULL,
    "rows_succeeded" integer DEFAULT 0 NOT NULL,
    "rows_failed" integer DEFAULT 0 NOT NULL,
    "errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "summary" "text",
    "job_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone
);


ALTER TABLE "public"."import_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "source" "text" DEFAULT 'csv'::"text" NOT NULL,
    "filename" "text",
    "rows_total" integer DEFAULT 0 NOT NULL,
    "rows_imported" integer DEFAULT 0 NOT NULL,
    "rows_failed" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "error" "text",
    "log" "jsonb",
    "created_by" "uuid",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "import_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'succeeded'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."import_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "reporter_id" "uuid" NOT NULL,
    "summary" "text" NOT NULL,
    "description" "text",
    "severity" "public"."incident_severity" DEFAULT 'minor'::"public"."incident_severity" NOT NULL,
    "status" "public"."incident_status" DEFAULT 'open'::"public"."incident_status" NOT NULL,
    "location" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "ai_summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "osha_classification" "text" DEFAULT 'none'::"text",
    "osha_recordable" boolean DEFAULT false NOT NULL,
    "days_away" integer DEFAULT 0 NOT NULL,
    "days_restricted" integer DEFAULT 0 NOT NULL,
    "body_part" "text",
    "injury_type" "text",
    "injury_source" "text",
    "closed_at" timestamp with time zone,
    "closed_by" "uuid",
    CONSTRAINT "incidents_days_away_check" CHECK (("days_away" >= 0)),
    CONSTRAINT "incidents_days_restricted_check" CHECK (("days_restricted" >= 0)),
    CONSTRAINT "incidents_osha_classification_check" CHECK (("osha_classification" = ANY (ARRAY['none'::"text", 'near_miss'::"text", 'first_aid'::"text", 'medical_treatment'::"text", 'restricted_duty'::"text", 'days_away'::"text", 'fatality'::"text"])))
);


ALTER TABLE "public"."incidents" OWNER TO "postgres";


COMMENT ON TABLE "public"."incidents" IS 'Field-logged incident reports (Opp #18).';



CREATE TABLE IF NOT EXISTS "public"."inspection_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "inspection_id" "uuid" NOT NULL,
    "template_item_id" "uuid",
    "position" integer DEFAULT 0 NOT NULL,
    "prompt" "text" NOT NULL,
    "result" "text" DEFAULT 'pending'::"text" NOT NULL,
    "photo_path" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inspection_items_result_check" CHECK (("result" = ANY (ARRAY['pending'::"text", 'pass'::"text", 'fail'::"text", 'na'::"text"])))
);


ALTER TABLE "public"."inspection_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_template_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "prompt" "text" NOT NULL,
    "requires_photo" boolean DEFAULT false NOT NULL,
    "requires_note_on_fail" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inspection_template_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" DEFAULT 'custom'::"text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inspection_templates_category_check" CHECK (("category" = ANY (ARRAY['rigging'::"text", 'fire'::"text", 'electrical'::"text", 'ada'::"text", 'food_safety'::"text", 'security'::"text", 'foh'::"text", 'medical'::"text", 'sustainability'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."inspection_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "template_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "inspector_id" "uuid",
    "scheduled_for" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "signature_path" "text",
    "signed_at" timestamp with time zone,
    "signed_by" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inspections_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'passed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."inspections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insurance_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "carrier" "text" NOT NULL,
    "policy_no" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "effective_on" "date",
    "expires_on" "date",
    "limits" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "document_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."insurance_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_connectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "secret_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."integration_connectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."platform_role" DEFAULT 'member'::"public"."platform_role" NOT NULL,
    "token" "text" DEFAULT "translate"("encode"("extensions"."gen_random_bytes"(32), 'base64'::"text"), '+/='::"text", '-_'::"text") NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    CONSTRAINT "invites_email_check" CHECK ((("length"("email") > 3) AND ("email" ~ '@'::"text"))),
    CONSTRAINT "invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."invites" IS 'Membership invitations. Admins insert; invitees select-by-token + update to accepted.';



COMMENT ON COLUMN "public"."invites"."token" IS 'URL-safe base64 nonce. Shown in /accept-invite/<token> links. Treat as a secret.';



CREATE TABLE IF NOT EXISTS "public"."invoice_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price_cents" bigint DEFAULT 0 NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xtc_code" integer,
    "atom_id" "uuid"
);


ALTER TABLE "public"."invoice_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "client_id" "uuid",
    "number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "amount_cents" bigint DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "issued_at" "date",
    "due_at" "date",
    "paid_at" timestamp with time zone,
    "stripe_payment_intent" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itil_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'normal'::"text" NOT NULL,
    "risk" "text" DEFAULT 'medium'::"text" NOT NULL,
    "impact" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "requested_by" "uuid",
    "assigned_to" "uuid",
    "planned_start" timestamp with time zone,
    "planned_end" timestamp with time zone,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "backout_plan" "text",
    "service_request_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "itil_changes_impact_check" CHECK (("impact" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "itil_changes_risk_check" CHECK (("risk" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "itil_changes_status_check" CHECK (("status" = ANY (ARRAY['proposed'::"text", 'in_review'::"text", 'approved'::"text", 'rejected'::"text", 'scheduled'::"text", 'implementing'::"text", 'implemented'::"text", 'closed'::"text", 'failed'::"text"]))),
    CONSTRAINT "itil_changes_type_check" CHECK (("type" = ANY (ARRAY['standard'::"text", 'normal'::"text", 'emergency'::"text", 'major'::"text"])))
);


ALTER TABLE "public"."itil_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itil_problems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'P3'::"text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "root_cause" "text",
    "workaround" "text",
    "reporter_id" "uuid",
    "assigned_to" "uuid",
    "linked_incident_id" "uuid",
    "linked_change_id" "uuid",
    "detected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "itil_problems_priority_check" CHECK (("priority" = ANY (ARRAY['P1'::"text", 'P2'::"text", 'P3'::"text", 'P4'::"text"]))),
    CONSTRAINT "itil_problems_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'investigating'::"text", 'known_error'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."itil_problems" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kb_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body_markdown" "text" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "author_id" "uuid",
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kb_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "source" "text",
    "stage" "public"."lead_stage" DEFAULT 'new'::"public"."lead_stage" NOT NULL,
    "estimated_value_cents" bigint,
    "assigned_to" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "region" "text",
    "country" "text",
    "postcode" "text",
    "lat" numeric,
    "lng" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "schedule_id" "uuid",
    "kind" "text" NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_id" "uuid",
    "due_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "outcome" "text",
    "notes" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "maintenance_jobs_kind_check" CHECK (("kind" = ANY (ARRAY['inspection'::"text", 'service'::"text", 'cert_renewal'::"text", 'compliance'::"text"]))),
    CONSTRAINT "maintenance_jobs_outcome_check" CHECK (("outcome" = ANY (ARRAY['pass'::"text", 'fail'::"text", 'partial'::"text"]))),
    CONSTRAINT "maintenance_jobs_target_kind_check" CHECK (("target_kind" = ANY (ARRAY['venue'::"text", 'equipment'::"text", 'credential'::"text", 'workforce'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."maintenance_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "cadence_days" integer NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_id" "uuid",
    "owner_id" "uuid",
    "last_run_at" timestamp with time zone,
    "next_run_at" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "maintenance_schedules_cadence_days_check" CHECK (("cadence_days" >= 1)),
    CONSTRAINT "maintenance_schedules_kind_check" CHECK (("kind" = ANY (ARRAY['inspection'::"text", 'service'::"text", 'cert_renewal'::"text", 'compliance'::"text"]))),
    CONSTRAINT "maintenance_schedules_target_kind_check" CHECK (("target_kind" = ANY (ARRAY['venue'::"text", 'equipment'::"text", 'credential'::"text", 'workforce'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."maintenance_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."major_incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "incident_id" "uuid",
    "name" "text" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "ics_roles" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "timeline" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."major_incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_encounters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "incident_id" "uuid",
    "venue_id" "uuid",
    "patient_ref" "text",
    "triage" "text",
    "chief_complaint" "text",
    "disposition" "text",
    "clinician_id" "uuid",
    "phi_encrypted" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."medical_encounters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."platform_role" DEFAULT 'member'::"public"."platform_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_developer" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


COMMENT ON COLUMN "public"."memberships"."is_developer" IS 'Per-user developer flag — orthogonal to billing role. Grants API key + webhook + audit access.';



CREATE TABLE IF NOT EXISTS "public"."mfa_recovery_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code_hash" "text" NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mfa_recovery_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."mfa_recovery_codes" IS 'Single-use recovery codes for TOTP MFA. sha256(plaintext). Plaintext is shown once at generation time and never persisted. Service-role-only access.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "href" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "kind" "text" DEFAULT 'system'::"text" NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_letter_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_letter_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "actor_user_id" "uuid",
    "actor_label" "text",
    "summary" "text" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."offer_letter_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_letters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "crew_member_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "reports_to_crew_member_id" "uuid",
    "venue_id" "uuid",
    "employer" "public"."offer_letter_employer" NOT NULL,
    "classification" "public"."offer_letter_classification" NOT NULL,
    "rate_card_item_id" "uuid",
    "per_diem_rate_card_item_id" "uuid",
    "compensation_basis" "public"."compensation_basis" DEFAULT 'per_day'::"public"."compensation_basis" NOT NULL,
    "override_amount_cents" bigint,
    "override_per_diem_cents" bigint,
    "engagement_start" "date",
    "engagement_end" "date",
    "travel_provided" boolean,
    "lodging_provided" boolean,
    "meals_provided" boolean,
    "extra_inclusions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "expectations_override" "text",
    "terms_override" "text",
    "public_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "access_code" "text" NOT NULL,
    "token_expires_at" timestamp with time zone,
    "status" "public"."offer_letter_status" DEFAULT 'draft'::"public"."offer_letter_status" NOT NULL,
    "sent_at" timestamp with time zone,
    "first_viewed_at" timestamp with time zone,
    "last_viewed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0 NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_signature" "text",
    "accepted_ip" "inet",
    "accepted_user_agent" "text",
    "declined_at" timestamp with time zone,
    "decline_reason" "text",
    "withdrawn_at" timestamp with time zone,
    "snapshot" "jsonb",
    "snapshot_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."offer_letters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_offer_letter_settings" (
    "org_id" "uuid" NOT NULL,
    "default_employer" "public"."offer_letter_employer" DEFAULT 'ghxstship'::"public"."offer_letter_employer" NOT NULL,
    "default_classification" "public"."offer_letter_classification" DEFAULT '1099'::"public"."offer_letter_classification" NOT NULL,
    "default_payment_schedule" "text" NOT NULL,
    "default_terms" "text" NOT NULL,
    "default_governing_law" "text" DEFAULT 'State of Florida'::"text" NOT NULL,
    "default_confidentiality" boolean DEFAULT true NOT NULL,
    "default_travel_provided" boolean DEFAULT true NOT NULL,
    "default_lodging_provided" boolean DEFAULT true NOT NULL,
    "default_meals_provided" boolean DEFAULT true NOT NULL,
    "default_inclusions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "signing_authority_crew_member_id" "uuid",
    "brand_logo_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_offer_letter_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "department" "text",
    "responsibilities" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."org_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."project_status" DEFAULT 'draft'::"public"."project_status" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "client_id" "uuid",
    "budget_cents" bigint,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "branding" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "xpms_phase" "public"."xpms_phase" DEFAULT 'discovery'::"public"."xpms_phase" NOT NULL,
    "geographic_scope" "public"."xpms_geo_scope",
    "tour_structure" "public"."xpms_tour_structure",
    "production_style" "public"."xpms_production_style",
    "event_token" "text",
    "venue_token" "text",
    "primary_venue_id" "uuid",
    CONSTRAINT "projects_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND ("char_length"("slug") <= 48)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."branding" IS 'White-label tokens. Schema: { accentColor, accentForeground, logoUrl, faviconUrl, heroImageUrl, ogImageUrl }';



CREATE TABLE IF NOT EXISTS "public"."rate_card_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "catalog" "text" DEFAULT 'delegation'::"text" NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit_price_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_card_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "location_id" "uuid",
    "name" "text" NOT NULL,
    "kind" "public"."venue_kind" DEFAULT 'competition'::"public"."venue_kind" NOT NULL,
    "cluster" "text",
    "capacity" integer,
    "handover_state" "public"."handover_state" DEFAULT 'not_started'::"public"."handover_state" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."offer_letters_resolved" WITH ("security_invoker"='true') AS
 SELECT "ol"."id",
    "ol"."org_id",
    "ol"."project_id",
    "ol"."crew_member_id",
    "ol"."role_id",
    "ol"."reports_to_crew_member_id",
    "ol"."venue_id",
    "ol"."employer",
    "ol"."classification",
    "ol"."rate_card_item_id",
    "ol"."per_diem_rate_card_item_id",
    "ol"."compensation_basis",
    "ol"."override_amount_cents",
    "ol"."override_per_diem_cents",
    "ol"."engagement_start",
    "ol"."engagement_end",
    "ol"."travel_provided",
    "ol"."lodging_provided",
    "ol"."meals_provided",
    "ol"."extra_inclusions",
    "ol"."expectations_override",
    "ol"."terms_override",
    "ol"."public_token",
    "ol"."access_code",
    "ol"."token_expires_at",
    "ol"."status",
    "ol"."sent_at",
    "ol"."first_viewed_at",
    "ol"."last_viewed_at",
    "ol"."view_count",
    "ol"."accepted_at",
    "ol"."accepted_signature",
    "ol"."accepted_ip",
    "ol"."accepted_user_agent",
    "ol"."declined_at",
    "ol"."decline_reason",
    "ol"."withdrawn_at",
    "ol"."snapshot",
    "ol"."snapshot_at",
    "ol"."created_by",
    "ol"."created_at",
    "ol"."updated_at",
    "cm"."name" AS "recipient_name",
    "cm"."email" AS "recipient_email",
    "cm"."phone" AS "recipient_phone",
    "cm"."user_id" AS "recipient_user_id",
    "r"."label" AS "role_title",
    "r"."slug" AS "role_slug",
    "r"."department" AS "role_department",
    "r"."description" AS "role_description",
    "r"."responsibilities" AS "role_responsibilities",
    "rt"."name" AS "reports_to_name",
    "rt"."email" AS "reports_to_email",
    "rt"."phone" AS "reports_to_phone",
    "v"."name" AS "venue_name",
    "l"."address" AS "venue_address",
    "l"."city" AS "venue_city",
    "l"."region" AS "venue_region",
    "l"."country" AS "venue_country",
    "p"."name" AS "project_name",
    "p"."slug" AS "project_slug",
    "p"."start_date" AS "project_start_date",
    "p"."end_date" AS "project_end_date",
    "rc"."unit_price_cents" AS "rate_unit_price_cents",
    "rc"."name" AS "rate_name",
    "rc"."sku" AS "rate_sku",
    "pdrc"."unit_price_cents" AS "per_diem_unit_price_cents",
    "pdrc"."sku" AS "per_diem_sku",
    COALESCE("ol"."engagement_start", "p"."start_date") AS "effective_start",
    COALESCE("ol"."engagement_end", "p"."end_date") AS "effective_end",
    GREATEST(((COALESCE("ol"."engagement_end", "p"."end_date") - COALESCE("ol"."engagement_start", "p"."start_date")) + 1), 0) AS "engagement_days",
    COALESCE("ol"."travel_provided", "s"."default_travel_provided") AS "effective_travel_provided",
    COALESCE("ol"."lodging_provided", "s"."default_lodging_provided") AS "effective_lodging_provided",
    COALESCE("ol"."meals_provided", "s"."default_meals_provided") AS "effective_meals_provided",
    COALESCE(NULLIF("ol"."terms_override", ''::"text"), "s"."default_terms") AS "effective_terms",
    "s"."default_governing_law" AS "effective_governing_law",
    "s"."default_payment_schedule" AS "effective_payment_schedule",
    "s"."default_confidentiality" AS "effective_confidentiality",
    ("s"."default_inclusions" || COALESCE("ol"."extra_inclusions", '[]'::"jsonb")) AS "effective_inclusions",
    COALESCE(NULLIF("ol"."expectations_override", ''::"text"), (COALESCE("r"."description", ''::"text") ||
        CASE
            WHEN ("jsonb_array_length"(COALESCE("r"."responsibilities", '[]'::"jsonb")) > 0) THEN ('

Key responsibilities:
'::"text" || ( SELECT "string_agg"(('• '::"text" || "rsp"."value"), '
'::"text") AS "string_agg"
               FROM "jsonb_array_elements_text"("r"."responsibilities") "rsp"("value")))
            ELSE ''::"text"
        END)) AS "effective_expectations",
        CASE
            WHEN ("ol"."override_amount_cents" IS NOT NULL) THEN "ol"."override_amount_cents"
            WHEN (("ol"."compensation_basis" = 'flat_fee'::"public"."compensation_basis") AND ("rc"."unit_price_cents" IS NOT NULL)) THEN ("rc"."unit_price_cents")::bigint
            WHEN (("ol"."compensation_basis" = 'per_day'::"public"."compensation_basis") AND ("rc"."unit_price_cents" IS NOT NULL)) THEN (("rc"."unit_price_cents" * GREATEST(((COALESCE("ol"."engagement_end", "p"."end_date") - COALESCE("ol"."engagement_start", "p"."start_date")) + 1), 0)))::bigint
            WHEN ("ol"."compensation_basis" = 'tbd'::"public"."compensation_basis") THEN (0)::bigint
            ELSE (0)::bigint
        END AS "effective_compensation_cents",
    COALESCE("ol"."override_per_diem_cents", ("pdrc"."unit_price_cents")::bigint, (0)::bigint) AS "effective_per_diem_cents",
    "sa"."name" AS "signing_authority_name",
    "sa"."email" AS "signing_authority_email"
   FROM (((((((((("public"."offer_letters" "ol"
     JOIN "public"."crew_members" "cm" ON (("cm"."id" = "ol"."crew_member_id")))
     JOIN "public"."org_roles" "r" ON (("r"."id" = "ol"."role_id")))
     LEFT JOIN "public"."crew_members" "rt" ON (("rt"."id" = "ol"."reports_to_crew_member_id")))
     LEFT JOIN "public"."venues" "v" ON (("v"."id" = "ol"."venue_id")))
     LEFT JOIN "public"."locations" "l" ON (("l"."id" = "v"."location_id")))
     JOIN "public"."projects" "p" ON (("p"."id" = "ol"."project_id")))
     LEFT JOIN "public"."rate_card_items" "rc" ON (("rc"."id" = "ol"."rate_card_item_id")))
     LEFT JOIN "public"."rate_card_items" "pdrc" ON (("pdrc"."id" = "ol"."per_diem_rate_card_item_id")))
     LEFT JOIN "public"."org_offer_letter_settings" "s" ON (("s"."org_id" = "ol"."org_id")))
     LEFT JOIN "public"."crew_members" "sa" ON (("sa"."id" = "s"."signing_authority_crew_member_id")));


ALTER VIEW "public"."offer_letters_resolved" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "hostname" "text" NOT NULL,
    "purpose" "text" DEFAULT 'portal'::"text" NOT NULL,
    "verification_method" "text" DEFAULT 'txt'::"text" NOT NULL,
    "verification_token" "text" DEFAULT "substr"("md5"(("random"())::"text"), 1, 24) NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_domains_purpose_check" CHECK (("purpose" = ANY (ARRAY['portal'::"text", 'marketing'::"text", 'email'::"text"]))),
    CONSTRAINT "org_domains_verification_method_check" CHECK (("verification_method" = ANY (ARRAY['txt'::"text", 'cname'::"text"])))
);


ALTER TABLE "public"."org_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_event_log_destinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "destination" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "secret_hash" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "last_published_id" "uuid",
    "last_published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_event_log_destinations_destination_check" CHECK (("destination" = ANY (ARRAY['http'::"text", 's3'::"text", 'datadog'::"text"])))
);


ALTER TABLE "public"."org_event_log_destinations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "connector" "text" NOT NULL,
    "status" "text" DEFAULT 'disabled'::"text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "installed_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_integrations_status_check" CHECK (("status" = ANY (ARRAY['disabled'::"text", 'installing'::"text", 'installed'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."org_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_ip_allowlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "cidr" "cidr" NOT NULL,
    "label" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_ip_allowlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_scim_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "name" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "last_used_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_scim_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_sequences" (
    "org_id" "uuid" NOT NULL,
    "scope" "text" NOT NULL,
    "current_val" bigint DEFAULT 0 NOT NULL,
    "format" "text" DEFAULT '{seq:04}'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_sso_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "provider_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "supabase_id" "text",
    "idp_metadata" "text",
    "logout_url" "text",
    "email_domains" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_sso_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['saml'::"text", 'oidc'::"text"])))
);


ALTER TABLE "public"."org_sso_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tier" "public"."tier" DEFAULT 'access'::"public"."tier" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "branding" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "name_override" "text",
    "logo_url" "text",
    "support_email" "text",
    "compliance_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "datamap" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stripe_customer_id" "text",
    "default_locale" "text" DEFAULT 'en'::"text" NOT NULL,
    "default_timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "default_currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "require_2fa_for" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "orgs_default_currency_check" CHECK (("default_currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "orgs_default_locale_check" CHECK (("default_locale" ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$'::"text")),
    CONSTRAINT "orgs_default_timezone_check" CHECK ((("char_length"("default_timezone") >= 1) AND ("char_length"("default_timezone") <= 64))),
    CONSTRAINT "orgs_slug_check" CHECK ((("slug" ~ '^[a-z0-9-]+$'::"text") AND ("char_length"("slug") <= 48)))
);


ALTER TABLE "public"."orgs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orgs"."branding" IS 'Per-org white-label tokens. Schema: { accentColor, accentForeground, logoUrl, faviconUrl, heroImageUrl, ogImageUrl, productName }';



COMMENT ON COLUMN "public"."orgs"."name_override" IS 'Display name shown in UI headers if set (e.g. "Acme Productions"). Falls back to orgs.name.';



COMMENT ON COLUMN "public"."orgs"."logo_url" IS 'https URL to org logo, replaces flyingbluewhale wordmark inside the tenant shell.';



COMMENT ON COLUMN "public"."orgs"."default_locale" IS 'Org-wide default BCP-47 language tag.';



COMMENT ON COLUMN "public"."orgs"."default_timezone" IS 'Org-wide default IANA timezone.';



COMMENT ON COLUMN "public"."orgs"."default_currency" IS 'Org-wide default ISO-4217 currency for billing artifacts.';



COMMENT ON COLUMN "public"."orgs"."require_2fa_for" IS 'Per-platform-role MFA requirement. Shape: { "owner": true, "admin": true, ... }. Enforced by middleware: a user whose role is truthy here must satisfy aal2 to access org resources. Empty object = MFA not required for any role.';



CREATE TABLE IF NOT EXISTS "public"."payment_application_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "payment_application_id" "uuid" NOT NULL,
    "po_line_item_id" "uuid" NOT NULL,
    "scheduled_value_cents" bigint DEFAULT 0 NOT NULL,
    "pct_complete_to_date" numeric DEFAULT 0 NOT NULL,
    "pct_complete_this_period" numeric DEFAULT 0 NOT NULL,
    "completed_to_date_cents" bigint DEFAULT 0 NOT NULL,
    "this_period_cents" bigint DEFAULT 0 NOT NULL,
    "retention_cents" bigint DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_application_lines_pct_complete_this_period_check" CHECK ((("pct_complete_this_period" >= (0)::numeric) AND ("pct_complete_this_period" <= (100)::numeric))),
    CONSTRAINT "payment_application_lines_pct_complete_to_date_check" CHECK ((("pct_complete_to_date" >= (0)::numeric) AND ("pct_complete_to_date" <= (100)::numeric)))
);


ALTER TABLE "public"."payment_application_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "application_number" integer NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "retention_pct" numeric DEFAULT 10 NOT NULL,
    "total_completed_cents" bigint DEFAULT 0 NOT NULL,
    "total_retention_cents" bigint DEFAULT 0 NOT NULL,
    "total_previously_paid_cents" bigint DEFAULT 0 NOT NULL,
    "total_due_cents" bigint DEFAULT 0 NOT NULL,
    "submitted_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_applications_retention_pct_check" CHECK ((("retention_pct" >= (0)::numeric) AND ("retention_pct" <= (100)::numeric))),
    CONSTRAINT "payment_applications_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'in_review'::"text", 'approved'::"text", 'rejected'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."payment_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "kind" "text" DEFAULT 'general'::"text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "playbooks_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."playbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_change_order_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "po_change_order_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price_cents" bigint DEFAULT 0 NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."po_change_order_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_change_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "purchase_order_id" "uuid" NOT NULL,
    "number" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "reason" "text",
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "amount_cents" bigint DEFAULT 0 NOT NULL,
    "schedule_impact_days" integer DEFAULT 0 NOT NULL,
    "proposed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "po_change_orders_status_check" CHECK (("status" = ANY (ARRAY['proposed'::"text", 'submitted'::"text", 'in_review'::"text", 'approved'::"text", 'rejected'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."po_change_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "prompt" "text" NOT NULL,
    "requires_photo" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "photo_path" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "po_checklist_items_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'complete'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."po_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price_cents" bigint DEFAULT 0 NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xtc_code" integer,
    "atom_id" "uuid"
);


ALTER TABLE "public"."po_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prequalification_questionnaires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prequalification_questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prequalification_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "prompt" "text" NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "scoring_weight" numeric DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "prequalification_questions_category_check" CHECK (("category" = ANY (ARRAY['insurance'::"text", 'safety'::"text", 'financial'::"text", 'references'::"text", 'licenses'::"text", 'experience'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."prequalification_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "attendees" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "agenda" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "decisions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."program_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."project_role" DEFAULT 'contributor'::"public"."project_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_members" IS 'Project-scoped access. Platform owner/admin/manager auto-bypass via RLS helpers.';



CREATE TABLE IF NOT EXISTS "public"."project_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "album" "text",
    "file_path" "text" NOT NULL,
    "caption" "text",
    "taken_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "taken_by" "uuid",
    "location_id" "uuid",
    "lat" numeric,
    "lng" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'custom'::"text" NOT NULL,
    "tagline" "text",
    "cover_image" "text",
    "blueprint" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "is_official" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "actor_id" "uuid",
    "actor_label" "text",
    "target_kind" "text",
    "target_id" "uuid",
    "summary" "text" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "target_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "state" "public"."approval_state" DEFAULT 'pending'::"public"."approval_state" NOT NULL,
    "due_at" timestamp with time zone,
    "signed_at" timestamp with time zone,
    "signed_by" "uuid",
    "signed_label" "text",
    "signed_ip" "inet",
    "decline_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_change_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "number" integer NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "delta_cents" bigint DEFAULT 0,
    "state" "public"."change_order_state" DEFAULT 'requested'::"public"."change_order_state" NOT NULL,
    "requested_by" "uuid",
    "requested_label" "text",
    "priced_at" timestamp with time zone,
    "decided_at" timestamp with time zone,
    "decided_by" "uuid",
    "decision_note" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_change_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "share_token" "text",
    "event_type" "text" NOT NULL,
    "metadata" "jsonb",
    "at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['viewed'::"text", 'block_expanded'::"text", 'addon_toggled'::"text", 'signature_started'::"text", 'signature_completed'::"text"])))
);


ALTER TABLE "public"."proposal_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "size_bytes" bigint,
    "mime_type" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_files_category_check" CHECK (("category" = ANY (ARRAY['proposal'::"text", 'sow'::"text", 'invoice'::"text", 'proof'::"text", 'condition_report'::"text", 'contract'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."proposal_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_gate_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phase_state_id" "uuid" NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "ordinal" smallint NOT NULL,
    "label" "text" NOT NULL,
    "is_done" boolean DEFAULT false NOT NULL,
    "done_at" timestamp with time zone,
    "done_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_gate_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_phase_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "phase_num" smallint NOT NULL,
    "phase_key" "text" NOT NULL,
    "phase_name" "text" NOT NULL,
    "status" "public"."proposal_phase_status" DEFAULT 'locked'::"public"."proposal_phase_status" NOT NULL,
    "started_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_phase_states_phase_num_check" CHECK ((("phase_num" >= 1) AND ("phase_num" <= 8)))
);


ALTER TABLE "public"."proposal_phase_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_revision_rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "target_kind" "text" NOT NULL,
    "target_id" "uuid",
    "round_num" integer DEFAULT 1 NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "state" "public"."revision_state" DEFAULT 'open'::"public"."revision_state" NOT NULL,
    "decided_at" timestamp with time zone,
    "decided_by" "uuid",
    "decision_note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_revision_rounds_target_kind_check" CHECK (("target_kind" = ANY (ARRAY['proposal'::"text", 'phase'::"text", 'change_order'::"text", 'asset'::"text"])))
);


ALTER TABLE "public"."proposal_revision_rounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "round_id" "uuid" NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "ordinal" smallint DEFAULT 1 NOT NULL,
    "label" "text" NOT NULL,
    "note" "text",
    "file_path" "text",
    "preview_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_share_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "audience" "text",
    "created_by" "uuid",
    "expires_at" timestamp with time zone,
    "last_viewed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0 NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_share_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "share_token" "text",
    "signer_name" "text" NOT NULL,
    "signer_email" "text",
    "signer_ip" "text",
    "signer_role" "text",
    "signature_kind" "text" NOT NULL,
    "signature_hash" "text" NOT NULL,
    "signature_data" "text",
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_signatures_signature_kind_check" CHECK (("signature_kind" = ANY (ARRAY['typed'::"text", 'canvas'::"text"])))
);


ALTER TABLE "public"."proposal_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "blocks" "jsonb" NOT NULL,
    "theme" "jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proposal_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "client_id" "uuid",
    "title" "text" NOT NULL,
    "amount_cents" bigint,
    "status" "public"."proposal_status" DEFAULT 'draft'::"public"."proposal_status" NOT NULL,
    "sent_at" timestamp with time zone,
    "signed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "doc_number" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "theme" "jsonb" DEFAULT '{"primary": "#D4782A", "secondary": "#6D4A2A"}'::"jsonb" NOT NULL,
    "blocks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "signer_name" "text",
    "signer_email" "text",
    "signature_hash" "text",
    "signature_data" "text",
    "deposit_percent" integer DEFAULT 25,
    "currency" "text" DEFAULT 'USD'::"text",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."punch_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "punch_list_id" "uuid",
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "assignee_id" "uuid",
    "vendor_id" "uuid",
    "due_at" "date",
    "closed_at" timestamp with time zone,
    "closed_by" "uuid",
    "site_plan_id" "uuid",
    "pin_x" numeric,
    "pin_y" numeric,
    "photo_path" "text",
    "show_ready_gate" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "punch_items_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "punch_items_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'ready_for_review'::"text", 'complete'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."punch_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."punch_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "punch_lists_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."punch_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "vendor_id" "uuid",
    "requisition_id" "uuid",
    "number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "amount_cents" bigint DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "public"."po_status" DEFAULT 'draft'::"public"."po_status" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "failure_count" integer DEFAULT 0 NOT NULL,
    "disabled_at" timestamp with time zone
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."push_subscriptions" IS 'Web Push (VAPID) subscriptions; one row per (user, browser device).';



CREATE TABLE IF NOT EXISTS "public"."rate_card_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "catalog" "text" DEFAULT 'delegation'::"text" NOT NULL,
    "delegation_id" "uuid",
    "requester_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "line_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_card_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "bucket" "text" NOT NULL,
    "limit_count" integer NOT NULL,
    "window_ms" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rate_limit_overrides_bucket_check" CHECK (("bucket" = ANY (ARRAY['ai'::"text", 'scan'::"text", 'webhook'::"text", 'auth'::"text"]))),
    CONSTRAINT "rate_limit_overrides_limit_count_check" CHECK (("limit_count" > 0)),
    CONSTRAINT "rate_limit_overrides_window_ms_check" CHECK (("window_ms" > 0))
);


ALTER TABLE "public"."rate_limit_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."readiness_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "name" "text" NOT NULL,
    "kind" "text" DEFAULT 'ttx'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "scenario" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "injects" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "aar" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."readiness_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."record_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "resource_table" "text" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "team_id" "uuid",
    "role" "public"."record_role" NOT NULL,
    "expires_at" timestamp with time zone,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_grants_principal_xor" CHECK (((("user_id" IS NOT NULL) AND ("team_id" IS NULL)) OR (("user_id" IS NULL) AND ("team_id" IS NOT NULL))))
);


ALTER TABLE "public"."record_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rentals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "equipment_id" "uuid" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "rate_cents" bigint,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xpms_atom_id" "uuid"
);


ALTER TABLE "public"."rentals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rentals"."xpms_atom_id" IS 'Canonical XPMS atom for this rental. Atom is the SSOT.';



CREATE TABLE IF NOT EXISTS "public"."requisitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "requester_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "estimated_cents" bigint,
    "status" "public"."req_status" DEFAULT 'draft'::"public"."req_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."requisitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "question" "text" NOT NULL,
    "category" "text",
    "asked_by" "uuid",
    "ball_in_court_id" "uuid",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "due_at" "date",
    "asked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "answered_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "official_answer" "text",
    "answered_by" "uuid",
    "linked_deliverable_id" "uuid",
    "linked_po_id" "uuid",
    "linked_site_plan_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_by" "uuid",
    CONSTRAINT "rfis_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "rfis_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'answered'::"text", 'closed'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."rfis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfq_response_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "rfq_response_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price_cents" bigint DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rfq_response_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfq_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "requisition_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "total_cents" bigint,
    "notes" "text",
    "submitted_at" timestamp with time zone,
    "awarded_at" timestamp with time zone,
    "awarded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rfq_responses_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'viewed'::"text", 'responded'::"text", 'no_bid'::"text", 'withdrawn'::"text", 'awarded'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."rfq_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "due_at" timestamp with time zone,
    "awarded_to_vendor_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rfqs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'closed'::"text", 'awarded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."rfqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."risks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "kind" "public"."raid_kind" DEFAULT 'risk'::"public"."raid_kind" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "likelihood" "public"."risk_likelihood" DEFAULT 'possible'::"public"."risk_likelihood" NOT NULL,
    "impact" "public"."risk_impact" DEFAULT 'moderate'::"public"."risk_impact" NOT NULL,
    "inherent_score" integer GENERATED ALWAYS AS ((
CASE "likelihood"
    WHEN 'rare'::"public"."risk_likelihood" THEN 1
    WHEN 'unlikely'::"public"."risk_likelihood" THEN 2
    WHEN 'possible'::"public"."risk_likelihood" THEN 3
    WHEN 'likely'::"public"."risk_likelihood" THEN 4
    ELSE 5
END *
CASE "impact"
    WHEN 'insignificant'::"public"."risk_impact" THEN 1
    WHEN 'minor'::"public"."risk_impact" THEN 2
    WHEN 'moderate'::"public"."risk_impact" THEN 3
    WHEN 'major'::"public"."risk_impact" THEN 4
    ELSE 5
END)) STORED,
    "residual_score" integer,
    "status" "public"."risk_status" DEFAULT 'open'::"public"."risk_status" NOT NULL,
    "owner_id" "uuid",
    "treatment" "text",
    "due_on" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."risks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rosters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid",
    "name" "text" NOT NULL,
    "day_of" "date" NOT NULL,
    "state" "public"."roster_state" DEFAULT 'draft'::"public"."roster_state" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rosters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."safeguarding_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "reporter_id" "uuid",
    "subject_ref" "text",
    "narrative" "text" NOT NULL,
    "evidence_paths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."safeguarding_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."safety_briefing_attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "briefing_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "crew_member_id" "uuid",
    "acknowledged_at" timestamp with time zone,
    "signature_path" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "safety_briefing_attendees_check" CHECK ((("user_id" IS NOT NULL) OR ("crew_member_id" IS NOT NULL)))
);


ALTER TABLE "public"."safety_briefing_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."safety_briefings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "shift_id" "uuid",
    "topic" "text" NOT NULL,
    "briefer_id" "uuid",
    "scheduled_for" timestamp with time zone NOT NULL,
    "conducted_at" timestamp with time zone,
    "notes" "text",
    "attachment_path" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "safety_briefings_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'conducted'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."safety_briefings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_request_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "kind" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_request_events_kind_check" CHECK (("kind" = ANY (ARRAY['opened'::"text", 'acknowledged'::"text", 'assigned'::"text", 'status_changed'::"text", 'note'::"text", 'resolved'::"text", 'cancelled'::"text", 'sla_breached'::"text"])))
);


ALTER TABLE "public"."service_request_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "venue_id" "uuid",
    "zone_id" "uuid",
    "category" "text" NOT NULL,
    "severity" "text" DEFAULT 'P3'::"text" NOT NULL,
    "summary" "text" NOT NULL,
    "description" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "requester_id" "uuid",
    "requester_email" "text",
    "requester_name" "text",
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acknowledged_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "sla_response_due" timestamp with time zone,
    "sla_resolution_due" timestamp with time zone,
    "sla_response_breached" boolean DEFAULT false NOT NULL,
    "sla_resolution_breached" boolean DEFAULT false NOT NULL,
    "resolution_note" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_requests_category_check" CHECK (("category" = ANY (ARRAY['AV'::"text", 'cleaning'::"text", 'repair'::"text", 'IT'::"text", 'hospitality'::"text", 'security'::"text", 'other'::"text"]))),
    CONSTRAINT "service_requests_severity_check" CHECK (("severity" = ANY (ARRAY['P1'::"text", 'P2'::"text", 'P3'::"text", 'P4'::"text"]))),
    CONSTRAINT "service_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'acknowledged'::"text", 'in_progress'::"text", 'resolved'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_sla_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "severity" "text" NOT NULL,
    "response_minutes" integer NOT NULL,
    "resolution_minutes" integer NOT NULL,
    "business_hours_only" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_sla_policies_severity_check" CHECK (("severity" = ANY (ARRAY['P1'::"text", 'P2'::"text", 'P3'::"text", 'P4'::"text"])))
);


ALTER TABLE "public"."service_sla_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "roster_id" "uuid",
    "workforce_member_id" "uuid",
    "venue_id" "uuid",
    "zone_id" "uuid",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "role" "text",
    "attendance" "public"."shift_attendance" DEFAULT 'scheduled'::"public"."shift_attendance" NOT NULL,
    "checked_in_at" timestamp with time zone,
    "checked_out_at" timestamp with time zone,
    "break_minutes" integer DEFAULT 0 NOT NULL,
    "meal_credit" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_plan_pins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "site_plan_id" "uuid" NOT NULL,
    "x_pct" numeric NOT NULL,
    "y_pct" numeric NOT NULL,
    "pin_type" "text" NOT NULL,
    "link_record_type" "text",
    "link_record_id" "uuid",
    "label" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_plan_pins_pin_type_check" CHECK (("pin_type" = ANY (ARRAY['issue'::"text", 'note'::"text", 'rfi'::"text", 'punch'::"text", 'inspection'::"text", 'rigging'::"text", 'power'::"text", 'equipment'::"text", 'zone'::"text"]))),
    CONSTRAINT "site_plan_pins_x_pct_check" CHECK ((("x_pct" >= (0)::numeric) AND ("x_pct" <= (100)::numeric))),
    CONSTRAINT "site_plan_pins_y_pct_check" CHECK ((("y_pct" >= (0)::numeric) AND ("y_pct" <= (100)::numeric)))
);


ALTER TABLE "public"."site_plan_pins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_plan_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "site_plan_id" "uuid" NOT NULL,
    "revision_label" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "notes" "text",
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_plan_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "venue_id" "uuid",
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "discipline" "text" DEFAULT 'site'::"text" NOT NULL,
    "current_revision_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_plans_discipline_check" CHECK (("discipline" = ANY (ARRAY['site'::"text", 'rigging'::"text", 'power'::"text", 'audio'::"text", 'video'::"text", 'lighting'::"text", 'comms'::"text", 'evacuation'::"text", 'hospitality'::"text", 'accessibility'::"text", 'sustainability'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."site_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_channel_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "channel_id" "text" NOT NULL,
    "channel_name" "text" NOT NULL,
    "event_pattern" "text" NOT NULL,
    "project_id" "uuid",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slack_channel_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_user_links" (
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "slack_user_id" "text" NOT NULL,
    "linked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slack_user_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slack_workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "team_id" "text" NOT NULL,
    "team_name" "text" NOT NULL,
    "bot_token" "text" NOT NULL,
    "bot_user_id" "text" NOT NULL,
    "icon_url" "text",
    "installed_by" "uuid",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slack_workspaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsor_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "sponsor_client_id" "uuid",
    "title" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "delivered" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'contracted'::"text" NOT NULL,
    "due_by" "date",
    "evidence_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sponsor_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stage_plots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "width_ft" numeric,
    "depth_ft" numeric,
    "elements" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "svg_url" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."stage_plots" OWNER TO "postgres";


COMMENT ON TABLE "public"."stage_plots" IS 'Interactive stage-plot editor state (Opp #11).';



CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "event_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "livemode" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_events" IS 'Dedup table for Stripe webhook deliveries. Row written before side effects; retries short-circuit.';



CREATE TABLE IF NOT EXISTS "public"."submittal_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "submittal_id" "uuid" NOT NULL,
    "round" integer NOT NULL,
    "file_path" "text",
    "submitted_by" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stamp" "text" DEFAULT 'no_stamp'::"text" NOT NULL,
    "stamp_notes" "text",
    "stamped_by" "uuid",
    "stamped_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "submittal_revisions_round_check" CHECK (("round" > 0)),
    CONSTRAINT "submittal_revisions_stamp_check" CHECK (("stamp" = ANY (ARRAY['no_stamp'::"text", 'approved'::"text", 'approved_with_comments'::"text", 'revise_resubmit'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."submittal_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submittals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "spec_section" "text",
    "vendor_id" "uuid",
    "ball_in_court_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "current_round" integer DEFAULT 1 NOT NULL,
    "due_at" "date",
    "submitted_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_by" "uuid",
    CONSTRAINT "submittals_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'in_review'::"text", 'approved'::"text", 'approved_with_comments'::"text", 'revise_resubmit'::"text", 'rejected'::"text", 'void'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."submittals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sustainability_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "scope" integer DEFAULT 1 NOT NULL,
    "kg_co2e" numeric DEFAULT 0 NOT NULL,
    "source" "text",
    "method" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sustainability_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "priority" integer DEFAULT 2 NOT NULL,
    "due_at" "date",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "xpms_atom_id" "uuid"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."xpms_atom_id" IS 'Canonical XPMS atom for this task (when atomically addressable).';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."threats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "severity" "text" NOT NULL,
    "likelihood" "text" NOT NULL,
    "treatment" "text" DEFAULT 'mitigate'::"text" NOT NULL,
    "classification" "text" DEFAULT 'internal'::"text" NOT NULL,
    "owner_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "threats_likelihood_check" CHECK (("likelihood" = ANY (ARRAY['rare'::"text", 'unlikely'::"text", 'possible'::"text", 'likely'::"text", 'almost_certain'::"text"]))),
    CONSTRAINT "threats_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "threats_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text", 'superseded'::"text"]))),
    CONSTRAINT "threats_treatment_check" CHECK (("treatment" = ANY (ARRAY['mitigate'::"text", 'accept'::"text", 'transfer'::"text", 'avoid'::"text"])))
);


ALTER TABLE "public"."threats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "scanner_id" "uuid" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location" "jsonb",
    "result" "text" NOT NULL,
    CONSTRAINT "ticket_scans_result_check" CHECK (("result" = ANY (ARRAY['accepted'::"text", 'duplicate'::"text", 'voided'::"text", 'not_found'::"text"])))
);


ALTER TABLE "public"."ticket_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "name" "text" NOT NULL,
    "channel" "text" DEFAULT 'public'::"text" NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "allocation" integer DEFAULT 0 NOT NULL,
    "sold" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "holder_name" "text",
    "holder_email" "text",
    "tier" "text" DEFAULT 'GA'::"text" NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'issued'::"public"."ticket_status" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scanned_at" timestamp with time zone,
    "scanned_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trademarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "mark" "text" NOT NULL,
    "jurisdiction" "text",
    "registration_no" "text",
    "registered_on" "date",
    "expires_on" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trademarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "metric" "text" NOT NULL,
    "quantity" bigint NOT NULL,
    "unit" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."usage_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage_events" IS 'Append-only per-tenant usage log. 90-day retention; aggregates roll into usage_rollups.';



CREATE TABLE IF NOT EXISTS "public"."usage_rollups" (
    "org_id" "uuid" NOT NULL,
    "metric" "text" NOT NULL,
    "bucket_start" timestamp with time zone NOT NULL,
    "bucket_duration_s" integer DEFAULT 3600 NOT NULL,
    "quantity" bigint NOT NULL,
    "unit" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_rollups" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage_rollups" IS 'Pre-aggregated usage counts per (org_id, metric, hour). Source of truth for billing + quotas.';



CREATE TABLE IF NOT EXISTS "public"."user_passkeys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credential_id" "text" NOT NULL,
    "public_key" "bytea" NOT NULL,
    "counter" bigint DEFAULT 0 NOT NULL,
    "device_name" "text",
    "transports" "text"[],
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_passkeys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text",
    "density" "text" DEFAULT 'comfortable'::"text",
    "locale" "text" DEFAULT 'en'::"text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "consent" "jsonb" DEFAULT '{"analytics": false, "essential": true, "marketing": false}'::"jsonb" NOT NULL,
    "table_views" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_org_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ui_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "currency" "text",
    CONSTRAINT "user_preferences_currency_check" CHECK ((("currency" IS NULL) OR ("currency" ~ '^[A-Z]{3}$'::"text"))),
    CONSTRAINT "user_preferences_density_check" CHECK (("density" = ANY (ARRAY['compact'::"text", 'comfortable'::"text", 'spacious'::"text"]))),
    CONSTRAINT "user_preferences_locale_shape_check" CHECK ((("locale" IS NULL) OR ("locale" ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$'::"text"))),
    CONSTRAINT "user_preferences_theme_check" CHECK (("theme" = ANY (ARRAY['glass'::"text", 'brutal'::"text", 'bento'::"text", 'kinetic'::"text", 'copilot'::"text", 'cyber'::"text", 'soft'::"text", 'earthy'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_preferences"."ui_state" IS 'Free-form UI state: palette_recents, sidebar_width, sidebar_pinned, sidebar_collapsed, etc.';



COMMENT ON COLUMN "public"."user_preferences"."currency" IS 'ISO-4217 currency override (null = inherit org default).';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_action_items" WITH ("security_invoker"='true') AS
 SELECT 'rfi'::"text" AS "kind",
    "r"."id" AS "record_id",
    "r"."org_id",
    "r"."project_id",
    "r"."subject" AS "title",
    "r"."ball_in_court_id" AS "owner_id",
    "r"."due_at",
    "r"."status",
    "r"."priority",
    "r"."created_at"
   FROM "public"."rfis" "r"
  WHERE ("r"."status" = 'open'::"text")
UNION ALL
 SELECT 'submittal'::"text" AS "kind",
    "s"."id" AS "record_id",
    "s"."org_id",
    "s"."project_id",
    "s"."title",
    "s"."ball_in_court_id" AS "owner_id",
    "s"."due_at",
    "s"."status",
    'normal'::"text" AS "priority",
    "s"."created_at"
   FROM "public"."submittals" "s"
  WHERE ("s"."status" = ANY (ARRAY['submitted'::"text", 'in_review'::"text", 'revise_resubmit'::"text"]))
UNION ALL
 SELECT 'punch'::"text" AS "kind",
    "p"."id" AS "record_id",
    "p"."org_id",
    "p"."project_id",
    "p"."title",
    "p"."assignee_id" AS "owner_id",
    "p"."due_at",
    "p"."status",
    "p"."priority",
    "p"."created_at"
   FROM "public"."punch_items" "p"
  WHERE ("p"."status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'ready_for_review'::"text"]))
UNION ALL
 SELECT 'inspection'::"text" AS "kind",
    "i"."id" AS "record_id",
    "i"."org_id",
    "i"."project_id",
    "i"."name" AS "title",
    "i"."inspector_id" AS "owner_id",
    ("i"."scheduled_for")::"date" AS "due_at",
    "i"."status",
    'normal'::"text" AS "priority",
    "i"."created_at"
   FROM "public"."inspections" "i"
  WHERE ("i"."status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text"]))
UNION ALL
 SELECT 'task'::"text" AS "kind",
    "t"."id" AS "record_id",
    "t"."org_id",
    "t"."project_id",
    "t"."title",
    "t"."assigned_to" AS "owner_id",
    "t"."due_at",
    ("t"."status")::"text" AS "status",
    'normal'::"text" AS "priority",
    "t"."created_at"
   FROM "public"."tasks" "t"
  WHERE ("t"."status" = ANY (ARRAY['todo'::"public"."task_status", 'in_progress'::"public"."task_status", 'blocked'::"public"."task_status", 'review'::"public"."task_status"]));


ALTER VIEW "public"."v_action_items" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_budget_health" WITH ("security_invoker"='true') AS
 SELECT "id",
    "org_id",
    "project_id",
    "name",
    "code",
    "amount_cents" AS "budget_cents",
    "committed_cents",
    "spent_cents",
    "forecast_cents",
    GREATEST("forecast_cents", ("committed_cents" + "spent_cents")) AS "eac_cents",
    ("amount_cents" - GREATEST("forecast_cents", ("committed_cents" + "spent_cents"))) AS "variance_cents",
        CASE
            WHEN ("amount_cents" = 0) THEN (0)::numeric
            ELSE "round"(((100.0 * ("spent_cents")::numeric) / ("amount_cents")::numeric), 2)
        END AS "pct_spent"
   FROM "public"."budgets" "b";


ALTER VIEW "public"."v_budget_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xpms_atom_tiers" (
    "atom_id" "uuid" NOT NULL,
    "tier" "public"."xpms_tier" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "weight" numeric(4,3) DEFAULT 1.000 NOT NULL,
    CONSTRAINT "xpms_atom_tiers_weight_check" CHECK ((("weight" >= (0)::numeric) AND ("weight" <= (1)::numeric)))
);


ALTER TABLE "public"."xpms_atom_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xpms_atoms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "identifier" "text" NOT NULL,
    "xtc_code" integer NOT NULL,
    "class_code" smallint NOT NULL,
    "division_code" smallint NOT NULL,
    "section_code" smallint NOT NULL,
    "org_token" "text" NOT NULL,
    "event_token" "text",
    "event_year" smallint,
    "venue_token" "text",
    "zone_token" "text",
    "sequence_no" integer NOT NULL,
    "revision" "text" DEFAULT 'A'::"text" NOT NULL,
    "state" "public"."xpms_state" DEFAULT 'uac'::"public"."xpms_state" NOT NULL,
    "phase" "public"."xpms_phase" DEFAULT 'discovery'::"public"."xpms_phase" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "quantity" numeric(14,4) DEFAULT 1 NOT NULL,
    "unit" "text",
    "cost_cents" bigint,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "uac_origin_id" "uuid",
    "lineage_root_id" "uuid",
    "owner_user_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xpms_atoms_check" CHECK (((("state" = 'tpc'::"public"."xpms_state") AND ("uac_origin_id" IS NOT NULL)) OR (("state" = 'uac'::"public"."xpms_state") AND ("uac_origin_id" IS NULL))))
);


ALTER TABLE "public"."xpms_atoms" OWNER TO "postgres";


COMMENT ON TABLE "public"."xpms_atoms" IS 'XPMS · APS — atomic production unit. Every element of a production is an atom.';



CREATE OR REPLACE VIEW "public"."v_xpms_atom_tier_composition" WITH ("security_invoker"='true') AS
 SELECT "a"."org_id",
    "a"."project_id",
    "t"."tier",
    "count"(*) AS "atom_count",
    "sum"(COALESCE("a"."cost_cents", (0)::bigint)) AS "cost_cents"
   FROM ("public"."xpms_atoms" "a"
     JOIN "public"."xpms_atom_tiers" "t" ON ((("t"."atom_id" = "a"."id") AND "t"."is_primary")))
  GROUP BY "a"."org_id", "a"."project_id", "t"."tier";


ALTER VIEW "public"."v_xpms_atom_tier_composition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xpms_variance_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "uac_atom_id" "uuid" NOT NULL,
    "tpc_atom_id" "uuid",
    "reason" "public"."xpms_variance_reason" NOT NULL,
    "qty_delta" numeric(14,4),
    "cost_delta_cents" bigint,
    "notes" "text",
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_by" "uuid" NOT NULL
);


ALTER TABLE "public"."xpms_variance_ledger" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_xpms_variance_summary" WITH ("security_invoker"='true') AS
 SELECT "v"."org_id",
    "a"."project_id",
    "a"."class_code",
    "v"."reason",
    "count"(*) AS "entries",
    "sum"(COALESCE("v"."qty_delta", (0)::numeric)) AS "qty_delta_total",
    "sum"(COALESCE("v"."cost_delta_cents", (0)::bigint)) AS "cost_delta_cents_total"
   FROM ("public"."xpms_variance_ledger" "v"
     JOIN "public"."xpms_atoms" "a" ON (("a"."id" = "v"."uac_atom_id")))
  GROUP BY "v"."org_id", "a"."project_id", "a"."class_code", "v"."reason";


ALTER VIEW "public"."v_xpms_variance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xtc_classes" (
    "code" smallint NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text" NOT NULL,
    "ord" smallint NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xtc_classes_code_check" CHECK ((("code" >= 0) AND ("code" <= 9)))
);


ALTER TABLE "public"."xtc_classes" OWNER TO "postgres";


COMMENT ON TABLE "public"."xtc_classes" IS 'XPMS · XTC Protocol — ten top-level classes (0..9).';



CREATE TABLE IF NOT EXISTS "public"."xtc_codes" (
    "code" integer NOT NULL,
    "section_code" smallint NOT NULL,
    "line_digit" smallint NOT NULL,
    "name" "text" NOT NULL,
    "face" "public"."xtc_face" NOT NULL,
    "description" "text",
    "is_position_root" boolean DEFAULT false NOT NULL,
    "reserved_range" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xtc_codes_code_check" CHECK ((("code" >= 0) AND ("code" <= 99999))),
    CONSTRAINT "xtc_codes_line_digit_check" CHECK ((("line_digit" >= 0) AND ("line_digit" <= 99)))
);


ALTER TABLE "public"."xtc_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."xtc_codes" IS 'XPMS · XTC Protocol — five-digit line-item codes (XYZWW). Append-only.';



CREATE TABLE IF NOT EXISTS "public"."xtc_divisions" (
    "code" smallint NOT NULL,
    "class_code" smallint NOT NULL,
    "digit" smallint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xtc_divisions_code_check" CHECK ((("code" >= 0) AND ("code" <= 99))),
    CONSTRAINT "xtc_divisions_digit_check" CHECK ((("digit" >= 0) AND ("digit" <= 9)))
);


ALTER TABLE "public"."xtc_divisions" OWNER TO "postgres";


COMMENT ON TABLE "public"."xtc_divisions" IS 'XPMS · XTC Protocol — divisions (XY) within each class.';



CREATE TABLE IF NOT EXISTS "public"."xtc_sections" (
    "code" smallint NOT NULL,
    "division_code" smallint NOT NULL,
    "digit" smallint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xtc_sections_code_check" CHECK ((("code" >= 0) AND ("code" <= 999))),
    CONSTRAINT "xtc_sections_digit_check" CHECK ((("digit" >= 0) AND ("digit" <= 9)))
);


ALTER TABLE "public"."xtc_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."xtc_sections" IS 'XPMS · XTC Protocol — sections (XYZ) within each division.';



CREATE OR REPLACE VIEW "public"."v_xtc_codebook" WITH ("security_invoker"='true') AS
 SELECT "c"."code" AS "class_code",
    "c"."name" AS "class_name",
    "c"."domain",
    "d"."code" AS "division_code",
    "d"."name" AS "division_name",
    "s"."code" AS "section_code",
    "s"."name" AS "section_name",
    "x"."code" AS "line_code",
    "x"."name" AS "line_name",
    "x"."face",
    "x"."is_position_root",
    "x"."reserved_range"
   FROM ((("public"."xtc_classes" "c"
     JOIN "public"."xtc_divisions" "d" ON (("d"."class_code" = "c"."code")))
     JOIN "public"."xtc_sections" "s" ON (("s"."division_code" = "d"."code")))
     JOIN "public"."xtc_codes" "x" ON (("x"."section_code" = "s"."code")))
  ORDER BY "c"."code", "d"."code", "s"."code", "x"."code";


ALTER VIEW "public"."v_xtc_codebook" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_prequalification_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "vendor_prequalification_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "answer" "text",
    "attachment_path" "text",
    "score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vendor_prequalification_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_prequalifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "score" numeric,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "expires_at" "date",
    "notes" "text",
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vendor_prequalifications_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'in_progress'::"text", 'submitted'::"text", 'approved'::"text", 'approved_conditional'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."vendor_prequalifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "category" "text",
    "w9_on_file" boolean DEFAULT false NOT NULL,
    "coi_expires_at" "date",
    "payout_account_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_build_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "summary" "text" NOT NULL,
    "trades_onsite" integer DEFAULT 0,
    "blockers" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_build_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "issuer" "text" NOT NULL,
    "certificate" "text" NOT NULL,
    "issued_on" "date",
    "expires_on" "date",
    "file_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_closeout_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assignee_id" "uuid",
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_closeout_items_category_check" CHECK (("category" = ANY (ARRAY['demob'::"text", 'reinstatement'::"text", 'asset_return'::"text", 'damage'::"text", 'waste'::"text", 'documentation'::"text", 'financial'::"text", 'other'::"text"]))),
    CONSTRAINT "venue_closeout_items_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'blocked'::"text", 'complete'::"text", 'waived'::"text"])))
);


ALTER TABLE "public"."venue_closeout_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_design_specs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "discipline" "text" NOT NULL,
    "revision" "text" DEFAULT 'A'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "notes" "text",
    "file_path" "text",
    "bom_requisition_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_design_specs_discipline_check" CHECK (("discipline" = ANY (ARRAY['overlay'::"text", 'seating'::"text", 'signage'::"text", 'broadcast'::"text", 'lighting'::"text", 'rigging'::"text", 'power'::"text", 'it'::"text", 'flooring'::"text", 'perimeter'::"text", 'other'::"text"]))),
    CONSTRAINT "venue_design_specs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."venue_design_specs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_handover_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assignee_id" "uuid",
    "due_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "notes" "text",
    "file_path" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_handover_items_category_check" CHECK (("category" = ANY (ARRAY['overlay'::"text", 'mep'::"text", 'it'::"text", 'signage'::"text", 'seating'::"text", 'broadcast'::"text", 'catering'::"text", 'medical'::"text", 'security'::"text", 'operations'::"text", 'other'::"text"]))),
    CONSTRAINT "venue_handover_items_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'blocked'::"text", 'passed'::"text", 'failed'::"text", 'waived'::"text"])))
);


ALTER TABLE "public"."venue_handover_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_vop_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "section_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_vop_sections_section_key_check" CHECK (("section_key" = ANY (ARRAY['overview'::"text", 'organisation'::"text", 'schedule'::"text", 'arrivals_departures'::"text", 'safety_security'::"text", 'medical'::"text", 'transport'::"text", 'catering'::"text", 'accreditation'::"text", 'communications'::"text", 'sustainability'::"text", 'annexes'::"text"]))),
    CONSTRAINT "venue_vop_sections_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."venue_vop_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_zones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parent_zone_id" "uuid",
    "allowed_categories" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venue_zones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."view_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "table_id" "text" NOT NULL,
    "type" "public"."view_type" DEFAULT 'grid'::"public"."view_type" NOT NULL,
    "scope" "public"."view_scope" DEFAULT 'private'::"public"."view_scope" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_locked" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."view_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visa_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "delegation_id" "uuid",
    "person_name" "text" NOT NULL,
    "nationality" "text",
    "passport_no" "text",
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "letter_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."visa_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webauthn_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "challenge" "text" NOT NULL,
    "type" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:05:00'::interval) NOT NULL,
    "consumed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "webauthn_challenges_type_check" CHECK (("type" = ANY (ARRAY['registration'::"text", 'authentication'::"text"])))
);


ALTER TABLE "public"."webauthn_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "endpoint_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "state" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "delivered_at" timestamp with time zone,
    "last_status" integer,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "webhook_deliveries_state_check" CHECK (("state" = ANY (ARRAY['pending'::"text", 'delivered'::"text", 'failed'::"text", 'dead'::"text"])))
);


ALTER TABLE "public"."webhook_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_endpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "events" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "secret" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_delivery_at" timestamp with time zone,
    "last_error" "text",
    "failure_count" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "webhook_endpoints_url_check" CHECK (("url" ~* '^https?://'::"text"))
);


ALTER TABLE "public"."webhook_endpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_order_broadcast_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "broadcast_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "responded_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_order_broadcast_invites_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'viewed'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."work_order_broadcast_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_order_broadcasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "requisition_id" "uuid",
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "budget_cents" bigint,
    "needed_by" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "awarded_to_vendor_id" "uuid",
    "awarded_at" timestamp with time zone,
    "awarded_by" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_order_broadcasts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'open'::"text", 'closed'::"text", 'awarded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."work_order_broadcasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workforce_deployments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "zone_id" "uuid",
    "shift_window" "tstzrange",
    "planned_fte" integer DEFAULT 0 NOT NULL,
    "actual_fte" integer DEFAULT 0 NOT NULL,
    "functional_area" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workforce_deployments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workforce_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "kind" "public"."workforce_kind" DEFAULT 'paid_staff'::"public"."workforce_kind" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "role" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "venue_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workforce_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xpms_project_composition" (
    "project_id" "uuid" NOT NULL,
    "tier" "public"."xpms_tier" NOT NULL,
    "share" numeric(5,4) NOT NULL,
    "metric" "text" DEFAULT 'scope'::"text" NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "xpms_project_composition_share_check" CHECK ((("share" >= (0)::numeric) AND ("share" <= (1)::numeric)))
);


ALTER TABLE "public"."xpms_project_composition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xpms_provenance_edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "from_atom_id" "uuid" NOT NULL,
    "to_atom_id" "uuid" NOT NULL,
    "kind" "public"."xpms_edge_kind" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "xpms_provenance_edges_check" CHECK (("from_atom_id" <> "to_atom_id"))
);


ALTER TABLE "public"."xpms_provenance_edges" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_scans"
    ADD CONSTRAINT "access_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accommodation_blocks"
    ADD CONSTRAINT "accommodation_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accreditation_categories"
    ADD CONSTRAINT "accreditation_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accreditation_changes"
    ADD CONSTRAINT "accreditation_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accreditations"
    ADD CONSTRAINT "accreditations_card_barcode_key" UNIQUE ("card_barcode");



ALTER TABLE ONLY "public"."accreditations"
    ADD CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_manifests"
    ADD CONSTRAINT "ad_manifests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_org_id_target_table_target_column_key" UNIQUE ("org_id", "target_table", "target_column");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."annotation_watchers"
    ADD CONSTRAINT "annotation_watchers_pkey" PRIMARY KEY ("annotation_id", "user_id");



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_links"
    ADD CONSTRAINT "asset_links_org_id_asset_serial_key" UNIQUE ("org_id", "asset_serial");



ALTER TABLE ONLY "public"."asset_links"
    ADD CONSTRAINT "asset_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_schedules"
    ADD CONSTRAINT "automation_schedules_automation_id_key" UNIQUE ("automation_id");



ALTER TABLE ONLY "public"."automation_schedules"
    ADD CONSTRAINT "automation_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_step_runs"
    ADD CONSTRAINT "automation_step_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_subscriptions"
    ADD CONSTRAINT "automation_subscriptions_automation_id_event_type_source_ta_key" UNIQUE ("automation_id", "event_type", "source_table", "source_id");



ALTER TABLE ONLY "public"."automation_subscriptions"
    ADD CONSTRAINT "automation_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_org_id_record_type_record_id_key" UNIQUE ("org_id", "record_type", "record_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_codes"
    ADD CONSTRAINT "cost_codes_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."cost_codes"
    ADD CONSTRAINT "cost_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crisis_alert_receipts"
    ADD CONSTRAINT "crisis_alert_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crisis_alerts"
    ADD CONSTRAINT "crisis_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cues"
    ADD CONSTRAINT "cues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_log_deliveries"
    ADD CONSTRAINT "daily_log_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_log_equipment"
    ADD CONSTRAINT "daily_log_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_log_manpower"
    ADD CONSTRAINT "daily_log_manpower_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_log_photos"
    ADD CONSTRAINT "daily_log_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_log_visitors"
    ADD CONSTRAINT "daily_log_visitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_org_id_project_id_log_date_key" UNIQUE ("org_id", "project_id", "log_date");



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delegation_entries"
    ADD CONSTRAINT "delegation_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delegations"
    ADD CONSTRAINT "delegations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverable_comments"
    ADD CONSTRAINT "deliverable_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverable_history"
    ADD CONSTRAINT "deliverable_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverable_templates"
    ADD CONSTRAINT "deliverable_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispatch_runs"
    ADD CONSTRAINT "dispatch_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domain_events"
    ADD CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dsar_requests"
    ADD CONSTRAINT "dsar_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."environmental_events"
    ADD CONSTRAINT "environmental_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_guides"
    ADD CONSTRAINT "event_guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_guides"
    ADD CONSTRAINT "event_guides_project_id_persona_key" UNIQUE ("project_id", "persona");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_runs"
    ADD CONSTRAINT "export_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fabrication_orders"
    ADD CONSTRAINT "fabrication_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_defs"
    ADD CONSTRAINT "form_defs_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."form_defs"
    ADD CONSTRAINT "form_defs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."governance_committees"
    ADD CONSTRAINT "governance_committees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."governance_policies"
    ADD CONSTRAINT "governance_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guard_tours"
    ADD CONSTRAINT "guard_tours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guide_comments"
    ADD CONSTRAINT "guide_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_runs"
    ADD CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_items"
    ADD CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_template_items"
    ADD CONSTRAINT "inspection_template_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_templates"
    ADD CONSTRAINT "inspection_templates_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."inspection_templates"
    ADD CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insurance_policies"
    ADD CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_connectors"
    ADD CONSTRAINT "integration_connectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_org_id_number_key" UNIQUE ("org_id", "number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kb_articles"
    ADD CONSTRAINT "kb_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_jobs"
    ADD CONSTRAINT "maintenance_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_schedules"
    ADD CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."major_incidents"
    ADD CONSTRAINT "major_incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_encounters"
    ADD CONSTRAINT "medical_encounters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_org_id_user_id_key" UNIQUE ("org_id", "user_id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_recovery_codes"
    ADD CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_letter_activity"
    ADD CONSTRAINT "offer_letter_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_org_id_project_id_crew_member_id_key" UNIQUE ("org_id", "project_id", "crew_member_id");



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_public_token_key" UNIQUE ("public_token");



ALTER TABLE ONLY "public"."org_domains"
    ADD CONSTRAINT "org_domains_hostname_key" UNIQUE ("hostname");



ALTER TABLE ONLY "public"."org_domains"
    ADD CONSTRAINT "org_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_event_log_destinations"
    ADD CONSTRAINT "org_event_log_destinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_org_id_connector_key" UNIQUE ("org_id", "connector");



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_ip_allowlist"
    ADD CONSTRAINT "org_ip_allowlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_offer_letter_settings"
    ADD CONSTRAINT "org_offer_letter_settings_pkey" PRIMARY KEY ("org_id");



ALTER TABLE ONLY "public"."org_roles"
    ADD CONSTRAINT "org_roles_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."org_roles"
    ADD CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_scim_tokens"
    ADD CONSTRAINT "org_scim_tokens_org_id_name_key" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."org_scim_tokens"
    ADD CONSTRAINT "org_scim_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_sequences"
    ADD CONSTRAINT "org_sequences_pkey" PRIMARY KEY ("org_id", "scope");



ALTER TABLE ONLY "public"."org_sso_providers"
    ADD CONSTRAINT "org_sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_sso_providers"
    ADD CONSTRAINT "org_sso_providers_supabase_id_key" UNIQUE ("supabase_id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."payment_application_lines"
    ADD CONSTRAINT "payment_application_lines_payment_application_id_po_line_it_key" UNIQUE ("payment_application_id", "po_line_item_id");



ALTER TABLE ONLY "public"."payment_application_lines"
    ADD CONSTRAINT "payment_application_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_org_id_purchase_order_id_application_n_key" UNIQUE ("org_id", "purchase_order_id", "application_number");



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."po_change_order_lines"
    ADD CONSTRAINT "po_change_order_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_org_id_purchase_order_id_number_key" UNIQUE ("org_id", "purchase_order_id", "number");



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."po_checklist_items"
    ADD CONSTRAINT "po_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."po_line_items"
    ADD CONSTRAINT "po_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prequalification_questionnaires"
    ADD CONSTRAINT "prequalification_questionnaires_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."prequalification_questionnaires"
    ADD CONSTRAINT "prequalification_questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prequalification_questions"
    ADD CONSTRAINT "prequalification_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_reviews"
    ADD CONSTRAINT "program_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_photos"
    ADD CONSTRAINT "project_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_activity"
    ADD CONSTRAINT "proposal_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_approvals"
    ADD CONSTRAINT "proposal_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_proposal_id_number_key" UNIQUE ("proposal_id", "number");



ALTER TABLE ONLY "public"."proposal_events"
    ADD CONSTRAINT "proposal_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_files"
    ADD CONSTRAINT "proposal_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_gate_items"
    ADD CONSTRAINT "proposal_gate_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_phase_states"
    ADD CONSTRAINT "proposal_phase_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_phase_states"
    ADD CONSTRAINT "proposal_phase_states_proposal_id_phase_num_key" UNIQUE ("proposal_id", "phase_num");



ALTER TABLE ONLY "public"."proposal_revision_rounds"
    ADD CONSTRAINT "proposal_revision_rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_revisions"
    ADD CONSTRAINT "proposal_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_share_links"
    ADD CONSTRAINT "proposal_share_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_share_links"
    ADD CONSTRAINT "proposal_share_links_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."proposal_signatures"
    ADD CONSTRAINT "proposal_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."punch_lists"
    ADD CONSTRAINT "punch_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_org_id_number_key" UNIQUE ("org_id", "number");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_card_items"
    ADD CONSTRAINT "rate_card_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_card_orders"
    ADD CONSTRAINT "rate_card_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_overrides"
    ADD CONSTRAINT "rate_limit_overrides_org_id_bucket_key" UNIQUE ("org_id", "bucket");



ALTER TABLE ONLY "public"."rate_limit_overrides"
    ADD CONSTRAINT "rate_limit_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."readiness_exercises"
    ADD CONSTRAINT "readiness_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_resource_table_resource_id_user_id_team_id_ro_key" UNIQUE ("resource_table", "resource_id", "user_id", "team_id", "role");



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfq_response_lines"
    ADD CONSTRAINT "rfq_response_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_org_id_requisition_id_vendor_id_key" UNIQUE ("org_id", "requisition_id", "vendor_id");



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."risks"
    ADD CONSTRAINT "risks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rosters"
    ADD CONSTRAINT "rosters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."safeguarding_reports"
    ADD CONSTRAINT "safeguarding_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."safety_briefing_attendees"
    ADD CONSTRAINT "safety_briefing_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_request_events"
    ADD CONSTRAINT "service_request_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_sla_policies"
    ADD CONSTRAINT "service_sla_policies_org_id_severity_key" UNIQUE ("org_id", "severity");



ALTER TABLE ONLY "public"."service_sla_policies"
    ADD CONSTRAINT "service_sla_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_plan_pins"
    ADD CONSTRAINT "site_plan_pins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_plan_revisions"
    ADD CONSTRAINT "site_plan_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_plan_revisions"
    ADD CONSTRAINT "site_plan_revisions_site_plan_id_revision_label_key" UNIQUE ("site_plan_id", "revision_label");



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_org_id_project_id_code_key" UNIQUE ("org_id", "project_id", "code");



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_channel_mappings"
    ADD CONSTRAINT "slack_channel_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_user_links"
    ADD CONSTRAINT "slack_user_links_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."slack_workspaces"
    ADD CONSTRAINT "slack_workspaces_org_id_key" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."slack_workspaces"
    ADD CONSTRAINT "slack_workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slack_workspaces"
    ADD CONSTRAINT "slack_workspaces_team_id_key" UNIQUE ("team_id");



ALTER TABLE ONLY "public"."sponsor_entitlements"
    ADD CONSTRAINT "sponsor_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stage_plots"
    ADD CONSTRAINT "stage_plots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_submittal_id_round_key" UNIQUE ("submittal_id", "round");



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sustainability_metrics"
    ADD CONSTRAINT "sustainability_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_org_id_slug_key" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."threats"
    ADD CONSTRAINT "threats_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."threats"
    ADD CONSTRAINT "threats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_scans"
    ADD CONSTRAINT "ticket_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trademarks"
    ADD CONSTRAINT "trademarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_rollups"
    ADD CONSTRAINT "usage_rollups_pkey" PRIMARY KEY ("org_id", "metric", "bucket_start", "bucket_duration_s");



ALTER TABLE ONLY "public"."user_passkeys"
    ADD CONSTRAINT "user_passkeys_credential_id_key" UNIQUE ("credential_id");



ALTER TABLE ONLY "public"."user_passkeys"
    ADD CONSTRAINT "user_passkeys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_prequalification_answers"
    ADD CONSTRAINT "vendor_prequalification_answe_vendor_prequalification_id_qu_key" UNIQUE ("vendor_prequalification_id", "question_id");



ALTER TABLE ONLY "public"."vendor_prequalification_answers"
    ADD CONSTRAINT "vendor_prequalification_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_org_id_vendor_id_questionnaire_id_key" UNIQUE ("org_id", "vendor_id", "questionnaire_id");



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_build_log"
    ADD CONSTRAINT "venue_build_log_org_id_venue_id_log_date_key" UNIQUE ("org_id", "venue_id", "log_date");



ALTER TABLE ONLY "public"."venue_build_log"
    ADD CONSTRAINT "venue_build_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_certifications"
    ADD CONSTRAINT "venue_certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_closeout_items"
    ADD CONSTRAINT "venue_closeout_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_design_specs"
    ADD CONSTRAINT "venue_design_specs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_handover_items"
    ADD CONSTRAINT "venue_handover_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_vop_sections"
    ADD CONSTRAINT "venue_vop_sections_org_id_venue_id_section_key_key" UNIQUE ("org_id", "venue_id", "section_key");



ALTER TABLE ONLY "public"."venue_vop_sections"
    ADD CONSTRAINT "venue_vop_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_zones"
    ADD CONSTRAINT "venue_zones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."view_configs"
    ADD CONSTRAINT "view_configs_org_id_table_id_scope_name_key" UNIQUE ("org_id", "table_id", "scope", "name");



ALTER TABLE ONLY "public"."view_configs"
    ADD CONSTRAINT "view_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visa_cases"
    ADD CONSTRAINT "visa_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_endpoints"
    ADD CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_order_broadcast_invites"
    ADD CONSTRAINT "work_order_broadcast_invites_broadcast_id_vendor_id_key" UNIQUE ("broadcast_id", "vendor_id");



ALTER TABLE ONLY "public"."work_order_broadcast_invites"
    ADD CONSTRAINT "work_order_broadcast_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workforce_deployments"
    ADD CONSTRAINT "workforce_deployments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workforce_members"
    ADD CONSTRAINT "workforce_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xpms_atom_tiers"
    ADD CONSTRAINT "xpms_atom_tiers_pkey" PRIMARY KEY ("atom_id", "tier");



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_org_id_identifier_key" UNIQUE ("org_id", "identifier");



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xpms_project_composition"
    ADD CONSTRAINT "xpms_project_composition_pkey" PRIMARY KEY ("project_id", "tier", "metric");



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_from_atom_id_to_atom_id_kind_key" UNIQUE ("from_atom_id", "to_atom_id", "kind");



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xpms_variance_ledger"
    ADD CONSTRAINT "xpms_variance_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xtc_classes"
    ADD CONSTRAINT "xtc_classes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."xtc_classes"
    ADD CONSTRAINT "xtc_classes_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."xtc_codes"
    ADD CONSTRAINT "xtc_codes_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."xtc_codes"
    ADD CONSTRAINT "xtc_codes_section_code_line_digit_key" UNIQUE ("section_code", "line_digit");



ALTER TABLE ONLY "public"."xtc_divisions"
    ADD CONSTRAINT "xtc_divisions_class_code_digit_key" UNIQUE ("class_code", "digit");



ALTER TABLE ONLY "public"."xtc_divisions"
    ADD CONSTRAINT "xtc_divisions_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."xtc_sections"
    ADD CONSTRAINT "xtc_sections_division_code_digit_key" UNIQUE ("division_code", "digit");



ALTER TABLE ONLY "public"."xtc_sections"
    ADD CONSTRAINT "xtc_sections_pkey" PRIMARY KEY ("code");



CREATE INDEX "access_scans_org_time_idx" ON "public"."access_scans" USING "btree" ("org_id", "scanned_at" DESC);



CREATE UNIQUE INDEX "accreditation_categories_code_idx" ON "public"."accreditation_categories" USING "btree" ("org_id", "code");



CREATE INDEX "accreditations_category_idx" ON "public"."accreditations" USING "btree" ("category_id");



CREATE INDEX "accreditations_org_state_idx" ON "public"."accreditations" USING "btree" ("org_id", "state");



CREATE INDEX "accreditations_user_idx" ON "public"."accreditations" USING "btree" ("user_id");



CREATE INDEX "ai_agents_target_idx" ON "public"."ai_agents" USING "btree" ("org_id", "target_table", "target_column");



CREATE INDEX "annotation_watchers_user_idx" ON "public"."annotation_watchers" USING "btree" ("user_id");



CREATE INDEX "annotations_assigned_open_idx" ON "public"."annotations" USING "btree" ("assigned_to", "status") WHERE (("deleted_at" IS NULL) AND ("assigned_to" IS NOT NULL));



CREATE INDEX "annotations_org_status_idx" ON "public"."annotations" USING "btree" ("org_id", "status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "annotations_parent_idx" ON "public"."annotations" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "annotations_project_status_idx" ON "public"."annotations" USING "btree" ("project_id", "status") WHERE (("deleted_at" IS NULL) AND ("project_id" IS NOT NULL));



CREATE INDEX "annotations_tags_idx" ON "public"."annotations" USING "gin" ("tags");



CREATE INDEX "annotations_target_idx" ON "public"."annotations" USING "btree" ("target_table", "target_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "audit_log_at_idx" ON "public"."audit_log" USING "btree" ("org_id", "at" DESC);



CREATE INDEX "audit_log_org_idx" ON "public"."audit_log" USING "btree" ("org_id");



CREATE INDEX "automation_runs_automation_started_idx" ON "public"."automation_runs" USING "btree" ("automation_id", "started_at" DESC);



CREATE INDEX "automation_runs_org_status_idx" ON "public"."automation_runs" USING "btree" ("org_id", "status");



CREATE INDEX "automation_runs_pending_idx" ON "public"."automation_runs" USING "btree" ("id") WHERE ("status" = 'pending'::"public"."automation_run_status");



CREATE INDEX "automation_schedules_due_idx" ON "public"."automation_schedules" USING "btree" ("next_run_at") WHERE ("enabled" = true);



CREATE INDEX "automation_step_runs_run_idx" ON "public"."automation_step_runs" USING "btree" ("run_id", "step_index");



CREATE INDEX "automation_subscriptions_event_idx" ON "public"."automation_subscriptions" USING "btree" ("event_type") WHERE ("enabled" = true);



CREATE INDEX "budgets_org_idx" ON "public"."budgets" USING "btree" ("org_id");



CREATE INDEX "clients_org_idx" ON "public"."clients" USING "btree" ("org_id");



CREATE UNIQUE INDEX "crew_members_org_email_idx" ON "public"."crew_members" USING "btree" ("org_id", "lower"("email"));



CREATE INDEX "crew_members_org_idx" ON "public"."crew_members" USING "btree" ("org_id");



CREATE UNIQUE INDEX "crisis_alert_receipts_unique" ON "public"."crisis_alert_receipts" USING "btree" ("alert_id", "user_id", "channel");



CREATE INDEX "dashboards_creator_idx" ON "public"."dashboards" USING "btree" ("created_by") WHERE ("scope" = 'private'::"public"."view_scope");



CREATE INDEX "dashboards_org_idx" ON "public"."dashboards" USING "btree" ("org_id");



CREATE UNIQUE INDEX "delegations_org_code_idx" ON "public"."delegations" USING "btree" ("org_id", "code");



CREATE INDEX "deliverables_closed_at_idx" ON "public"."deliverables" USING "btree" ("closed_at") WHERE ("closed_at" IS NOT NULL);



CREATE INDEX "deliverables_project_idx" ON "public"."deliverables" USING "btree" ("project_id");



CREATE INDEX "dispatch_runs_org_fleet_idx" ON "public"."dispatch_runs" USING "btree" ("org_id", "fleet", "scheduled_depart");



CREATE INDEX "domain_events_org_event_idx" ON "public"."domain_events" USING "btree" ("org_id", "event_type", "emitted_at" DESC);



CREATE INDEX "domain_events_pending_idx" ON "public"."domain_events" USING "btree" ("emitted_at") WHERE ("dispatched_at" IS NULL);



CREATE INDEX "equipment_org_idx" ON "public"."equipment" USING "btree" ("org_id");



CREATE INDEX "event_guides_org_idx" ON "public"."event_guides" USING "btree" ("org_id");



CREATE INDEX "event_guides_project_idx" ON "public"."event_guides" USING "btree" ("project_id");



CREATE INDEX "events_created_by_idx" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "events_org_idx" ON "public"."events" USING "btree" ("org_id");



CREATE INDEX "expenses_org_idx" ON "public"."expenses" USING "btree" ("org_id");



CREATE INDEX "export_runs_org_status_idx" ON "public"."export_runs" USING "btree" ("org_id", "status");



CREATE INDEX "fabrication_org_idx" ON "public"."fabrication_orders" USING "btree" ("org_id");



CREATE INDEX "guide_comments_guide_idx" ON "public"."guide_comments" USING "btree" ("guide_id");



CREATE INDEX "idx_access_scans_accreditation_id" ON "public"."access_scans" USING "btree" ("accreditation_id");



CREATE INDEX "idx_access_scans_venue_id" ON "public"."access_scans" USING "btree" ("venue_id");



CREATE INDEX "idx_access_scans_zone_id" ON "public"."access_scans" USING "btree" ("zone_id");



CREATE INDEX "idx_accreditation_changes_accreditation_id" ON "public"."accreditation_changes" USING "btree" ("accreditation_id");



CREATE INDEX "idx_ad_manifests_delegation_id" ON "public"."ad_manifests" USING "btree" ("delegation_id");



CREATE INDEX "idx_ai_conversations_org_id" ON "public"."ai_conversations" USING "btree" ("org_id");



CREATE INDEX "idx_ai_conversations_user_id" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_messages_conversation_id" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_api_keys_created_by" ON "public"."api_keys" USING "btree" ("created_by");



CREATE INDEX "idx_api_keys_org_id" ON "public"."api_keys" USING "btree" ("org_id");



CREATE INDEX "idx_asset_links_credential_id" ON "public"."asset_links" USING "btree" ("credential_id");



CREATE INDEX "idx_audit_log_actor_id" ON "public"."audit_log" USING "btree" ("actor_id");



CREATE INDEX "idx_automations_created_by" ON "public"."automations" USING "btree" ("created_by");



CREATE INDEX "idx_automations_org" ON "public"."automations" USING "btree" ("org_id");



CREATE INDEX "idx_budgets_project_id" ON "public"."budgets" USING "btree" ("project_id");



CREATE INDEX "idx_budgets_xtc_code" ON "public"."budgets" USING "btree" ("xtc_code");



CREATE INDEX "idx_campaigns_org_window" ON "public"."campaigns" USING "btree" ("org_id", "starts_on", "ends_on");



CREATE INDEX "idx_campaigns_owner_id" ON "public"."campaigns" USING "btree" ("owner_id");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_committees_org" ON "public"."governance_committees" USING "btree" ("org_id");



CREATE INDEX "idx_conv_msg_thread" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_conversation_messages_author_id" ON "public"."conversation_messages" USING "btree" ("author_id");



CREATE INDEX "idx_conversation_messages_org_id" ON "public"."conversation_messages" USING "btree" ("org_id");



CREATE INDEX "idx_cost_codes_xtc_code" ON "public"."cost_codes" USING "btree" ("xtc_code");



CREATE INDEX "idx_credentials_crew_member_id" ON "public"."credentials" USING "btree" ("crew_member_id");



CREATE INDEX "idx_credentials_org_id" ON "public"."credentials" USING "btree" ("org_id");



CREATE INDEX "idx_crew_members_user_id" ON "public"."crew_members" USING "btree" ("user_id");



CREATE INDEX "idx_crew_members_xpms_atom_id" ON "public"."crew_members" USING "btree" ("xpms_atom_id");



CREATE INDEX "idx_crew_members_xtc_code" ON "public"."crew_members" USING "btree" ("xtc_code");



CREATE INDEX "idx_cues_created_by" ON "public"."cues" USING "btree" ("created_by");



CREATE INDEX "idx_cues_event_id" ON "public"."cues" USING "btree" ("event_id");



CREATE INDEX "idx_cues_org_event_time" ON "public"."cues" USING "btree" ("org_id", "event_id", "scheduled_at");



CREATE INDEX "idx_cues_owner_id" ON "public"."cues" USING "btree" ("owner_id");



CREATE INDEX "idx_daily_log_deliveries_org_id" ON "public"."daily_log_deliveries" USING "btree" ("org_id");



CREATE INDEX "idx_daily_log_deliveries_received_by" ON "public"."daily_log_deliveries" USING "btree" ("received_by");



CREATE INDEX "idx_daily_log_deliveries_vendor_id" ON "public"."daily_log_deliveries" USING "btree" ("vendor_id");



CREATE INDEX "idx_daily_log_equipment_equipment_id" ON "public"."daily_log_equipment" USING "btree" ("equipment_id");



CREATE INDEX "idx_daily_log_equipment_org_id" ON "public"."daily_log_equipment" USING "btree" ("org_id");



CREATE INDEX "idx_daily_log_manpower_org_id" ON "public"."daily_log_manpower" USING "btree" ("org_id");



CREATE INDEX "idx_daily_log_manpower_vendor_id" ON "public"."daily_log_manpower" USING "btree" ("vendor_id");



CREATE INDEX "idx_daily_log_photos_org_id" ON "public"."daily_log_photos" USING "btree" ("org_id");



CREATE INDEX "idx_daily_log_photos_taken_by" ON "public"."daily_log_photos" USING "btree" ("taken_by");



CREATE INDEX "idx_daily_log_visitors_org_id" ON "public"."daily_log_visitors" USING "btree" ("org_id");



CREATE INDEX "idx_daily_logs_approved_by" ON "public"."daily_logs" USING "btree" ("approved_by");



CREATE INDEX "idx_daily_logs_created_by" ON "public"."daily_logs" USING "btree" ("created_by");



CREATE INDEX "idx_daily_logs_project_id" ON "public"."daily_logs" USING "btree" ("project_id");



CREATE INDEX "idx_daily_logs_submitted_by" ON "public"."daily_logs" USING "btree" ("submitted_by");



CREATE INDEX "idx_delegation_entries_delegation_id" ON "public"."delegation_entries" USING "btree" ("delegation_id");



CREATE INDEX "idx_deliverable_comments_deliverable_id" ON "public"."deliverable_comments" USING "btree" ("deliverable_id");



CREATE INDEX "idx_deliverable_comments_user_id" ON "public"."deliverable_comments" USING "btree" ("user_id");



CREATE INDEX "idx_deliverable_history_changed_by" ON "public"."deliverable_history" USING "btree" ("changed_by");



CREATE INDEX "idx_deliverable_history_deliverable_id" ON "public"."deliverable_history" USING "btree" ("deliverable_id");



CREATE INDEX "idx_deliverables_org_id" ON "public"."deliverables" USING "btree" ("org_id");



CREATE INDEX "idx_deliverables_reviewed_by" ON "public"."deliverables" USING "btree" ("reviewed_by");



CREATE INDEX "idx_deliverables_submitted_by" ON "public"."deliverables" USING "btree" ("submitted_by");



CREATE INDEX "idx_dispatch_runs_destination_venue_id" ON "public"."dispatch_runs" USING "btree" ("destination_venue_id");



CREATE INDEX "idx_dispatch_runs_origin_venue_id" ON "public"."dispatch_runs" USING "btree" ("origin_venue_id");



CREATE INDEX "idx_dl_deliveries_log" ON "public"."daily_log_deliveries" USING "btree" ("daily_log_id");



CREATE INDEX "idx_dl_equipment_log" ON "public"."daily_log_equipment" USING "btree" ("daily_log_id");



CREATE INDEX "idx_dl_manpower_log" ON "public"."daily_log_manpower" USING "btree" ("daily_log_id");



CREATE INDEX "idx_dl_photos_log" ON "public"."daily_log_photos" USING "btree" ("daily_log_id");



CREATE INDEX "idx_dl_visitors_log" ON "public"."daily_log_visitors" USING "btree" ("daily_log_id");



CREATE INDEX "idx_environmental_events_venue_id" ON "public"."environmental_events" USING "btree" ("venue_id");



CREATE INDEX "idx_equipment_xpms_atom_id" ON "public"."equipment" USING "btree" ("xpms_atom_id");



CREATE INDEX "idx_equipment_xtc_code" ON "public"."equipment" USING "btree" ("xtc_code");



CREATE INDEX "idx_event_guides_created_by" ON "public"."event_guides" USING "btree" ("created_by");



CREATE INDEX "idx_events_project_id" ON "public"."events" USING "btree" ("project_id");



CREATE INDEX "idx_expenses_atom_id" ON "public"."expenses" USING "btree" ("atom_id");



CREATE INDEX "idx_expenses_project_id" ON "public"."expenses" USING "btree" ("project_id");



CREATE INDEX "idx_expenses_submitter_id" ON "public"."expenses" USING "btree" ("submitter_id");



CREATE INDEX "idx_expenses_xtc_code" ON "public"."expenses" USING "btree" ("xtc_code");



CREATE INDEX "idx_fabrication_orders_project_id" ON "public"."fabrication_orders" USING "btree" ("project_id");



CREATE INDEX "idx_fabrication_orders_xpms_atom_id" ON "public"."fabrication_orders" USING "btree" ("xpms_atom_id");



CREATE INDEX "idx_fabrication_orders_xtc_code" ON "public"."fabrication_orders" USING "btree" ("xtc_code");



CREATE INDEX "idx_form_defs_created_by" ON "public"."form_defs" USING "btree" ("created_by");



CREATE INDEX "idx_form_defs_org" ON "public"."form_defs" USING "btree" ("org_id");



CREATE INDEX "idx_form_submissions_form_created" ON "public"."form_submissions" USING "btree" ("form_id", "created_at" DESC);



CREATE INDEX "idx_form_submissions_org" ON "public"."form_submissions" USING "btree" ("org_id");



CREATE INDEX "idx_governance_committees_chair_user_id" ON "public"."governance_committees" USING "btree" ("chair_user_id");



CREATE INDEX "idx_governance_policies_owner_user_id" ON "public"."governance_policies" USING "btree" ("owner_user_id");



CREATE INDEX "idx_guard_tours_guard_id" ON "public"."guard_tours" USING "btree" ("guard_id");



CREATE INDEX "idx_guard_tours_next_run" ON "public"."guard_tours" USING "btree" ("org_id", "next_run_at");



CREATE INDEX "idx_guard_tours_venue_id" ON "public"."guard_tours" USING "btree" ("venue_id");



CREATE INDEX "idx_guide_comments_author_user_id" ON "public"."guide_comments" USING "btree" ("author_user_id");



CREATE INDEX "idx_guide_comments_org_id" ON "public"."guide_comments" USING "btree" ("org_id");



CREATE INDEX "idx_guide_comments_parent_id" ON "public"."guide_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_idempotency_keys_org_id" ON "public"."idempotency_keys" USING "btree" ("org_id");



CREATE INDEX "idx_idempotency_keys_user_id" ON "public"."idempotency_keys" USING "btree" ("user_id");



CREATE INDEX "idx_import_runs_created_by" ON "public"."import_runs" USING "btree" ("created_by");



CREATE INDEX "idx_import_runs_org_created" ON "public"."import_runs" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_insp_items_inspection" ON "public"."inspection_items" USING "btree" ("inspection_id", "position");



CREATE INDEX "idx_insp_tpl_items_tpl" ON "public"."inspection_template_items" USING "btree" ("template_id", "position");



CREATE INDEX "idx_inspection_items_org_id" ON "public"."inspection_items" USING "btree" ("org_id");



CREATE INDEX "idx_inspection_items_template_item_id" ON "public"."inspection_items" USING "btree" ("template_item_id");



CREATE INDEX "idx_inspection_template_items_org_id" ON "public"."inspection_template_items" USING "btree" ("org_id");



CREATE INDEX "idx_inspection_templates_created_by" ON "public"."inspection_templates" USING "btree" ("created_by");



CREATE INDEX "idx_inspections_created_by" ON "public"."inspections" USING "btree" ("created_by");



CREATE INDEX "idx_inspections_inspector_id" ON "public"."inspections" USING "btree" ("inspector_id");



CREATE INDEX "idx_inspections_project" ON "public"."inspections" USING "btree" ("project_id", "status");



CREATE INDEX "idx_inspections_signed_by" ON "public"."inspections" USING "btree" ("signed_by");



CREATE INDEX "idx_inspections_template_id" ON "public"."inspections" USING "btree" ("template_id");



CREATE INDEX "idx_invites_accepted_by" ON "public"."invites" USING "btree" ("accepted_by");



CREATE INDEX "idx_invites_invited_by" ON "public"."invites" USING "btree" ("invited_by");



CREATE INDEX "idx_invoice_line_items_atom_id" ON "public"."invoice_line_items" USING "btree" ("atom_id");



CREATE INDEX "idx_invoice_line_items_invoice_id" ON "public"."invoice_line_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_line_items_xtc_code" ON "public"."invoice_line_items" USING "btree" ("xtc_code");



CREATE INDEX "idx_invoices_client_id" ON "public"."invoices" USING "btree" ("client_id");



CREATE INDEX "idx_invoices_created_by" ON "public"."invoices" USING "btree" ("created_by");



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("project_id");



CREATE INDEX "idx_itil_changes_assigned_to" ON "public"."itil_changes" USING "btree" ("assigned_to");



CREATE INDEX "idx_itil_changes_planned" ON "public"."itil_changes" USING "btree" ("org_id", "planned_start");



CREATE INDEX "idx_itil_changes_requested_by" ON "public"."itil_changes" USING "btree" ("requested_by");



CREATE INDEX "idx_itil_changes_service_request_id" ON "public"."itil_changes" USING "btree" ("service_request_id");



CREATE INDEX "idx_itil_problems_assigned_to" ON "public"."itil_problems" USING "btree" ("assigned_to");



CREATE INDEX "idx_itil_problems_linked_change_id" ON "public"."itil_problems" USING "btree" ("linked_change_id");



CREATE INDEX "idx_itil_problems_linked_incident_id" ON "public"."itil_problems" USING "btree" ("linked_incident_id");



CREATE INDEX "idx_itil_problems_priority" ON "public"."itil_problems" USING "btree" ("org_id", "priority");



CREATE INDEX "idx_itil_problems_reporter_id" ON "public"."itil_problems" USING "btree" ("reporter_id");



CREATE INDEX "idx_leads_assigned_to" ON "public"."leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_leads_created_by" ON "public"."leads" USING "btree" ("created_by");



CREATE INDEX "idx_maint_jobs_org_due" ON "public"."maintenance_jobs" USING "btree" ("org_id", "due_at") WHERE ("completed_at" IS NULL);



CREATE INDEX "idx_maintenance_jobs_completed_by" ON "public"."maintenance_jobs" USING "btree" ("completed_by");



CREATE INDEX "idx_maintenance_jobs_schedule_id" ON "public"."maintenance_jobs" USING "btree" ("schedule_id");



CREATE INDEX "idx_maintenance_schedules_org_id" ON "public"."maintenance_schedules" USING "btree" ("org_id");



CREATE INDEX "idx_maintenance_schedules_owner_id" ON "public"."maintenance_schedules" USING "btree" ("owner_id");



CREATE INDEX "idx_medical_encounters_venue_id" ON "public"."medical_encounters" USING "btree" ("venue_id");



CREATE INDEX "idx_mileage_logs_project_id" ON "public"."mileage_logs" USING "btree" ("project_id");



CREATE INDEX "idx_mileage_logs_user_id" ON "public"."mileage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_org_id" ON "public"."notifications" USING "btree" ("org_id");



CREATE INDEX "idx_offer_letter_activity_actor_user_id" ON "public"."offer_letter_activity" USING "btree" ("actor_user_id");



CREATE INDEX "idx_offer_letter_activity_org_id" ON "public"."offer_letter_activity" USING "btree" ("org_id");



CREATE INDEX "idx_offer_letters_created_by" ON "public"."offer_letters" USING "btree" ("created_by");



CREATE INDEX "idx_offer_letters_per_diem_rate_card_item_id" ON "public"."offer_letters" USING "btree" ("per_diem_rate_card_item_id");



CREATE INDEX "idx_offer_letters_rate_card_item_id" ON "public"."offer_letters" USING "btree" ("rate_card_item_id");



CREATE INDEX "idx_offer_letters_reports_to_crew_member_id" ON "public"."offer_letters" USING "btree" ("reports_to_crew_member_id");



CREATE INDEX "idx_offer_letters_role_id" ON "public"."offer_letters" USING "btree" ("role_id");



CREATE INDEX "idx_offer_letters_venue_id" ON "public"."offer_letters" USING "btree" ("venue_id");



CREATE INDEX "idx_org_domains_org" ON "public"."org_domains" USING "btree" ("org_id");



CREATE INDEX "idx_org_integrations_org" ON "public"."org_integrations" USING "btree" ("org_id");



CREATE INDEX "idx_org_offer_letter_settings_signing_authority_crew_member_id" ON "public"."org_offer_letter_settings" USING "btree" ("signing_authority_crew_member_id");



CREATE INDEX "idx_org_roles_org" ON "public"."org_roles" USING "btree" ("org_id");



CREATE INDEX "idx_pay_apps_po" ON "public"."payment_applications" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_pay_apps_status" ON "public"."payment_applications" USING "btree" ("org_id", "status");



CREATE INDEX "idx_payment_application_lines_org_id" ON "public"."payment_application_lines" USING "btree" ("org_id");



CREATE INDEX "idx_payment_application_lines_po_line_item_id" ON "public"."payment_application_lines" USING "btree" ("po_line_item_id");



CREATE INDEX "idx_payment_applications_approved_by" ON "public"."payment_applications" USING "btree" ("approved_by");



CREATE INDEX "idx_payment_applications_created_by" ON "public"."payment_applications" USING "btree" ("created_by");



CREATE INDEX "idx_payment_applications_project_id" ON "public"."payment_applications" USING "btree" ("project_id");



CREATE INDEX "idx_payment_applications_vendor_id" ON "public"."payment_applications" USING "btree" ("vendor_id");



CREATE INDEX "idx_playbooks_org_status" ON "public"."playbooks" USING "btree" ("org_id", "status");



CREATE INDEX "idx_playbooks_owner_id" ON "public"."playbooks" USING "btree" ("owner_id");



CREATE INDEX "idx_po_change_order_lines_org_id" ON "public"."po_change_order_lines" USING "btree" ("org_id");



CREATE INDEX "idx_po_change_order_lines_po_change_order_id" ON "public"."po_change_order_lines" USING "btree" ("po_change_order_id");



CREATE INDEX "idx_po_change_orders_approved_by" ON "public"."po_change_orders" USING "btree" ("approved_by");



CREATE INDEX "idx_po_change_orders_created_by" ON "public"."po_change_orders" USING "btree" ("created_by");



CREATE INDEX "idx_po_change_orders_project_id" ON "public"."po_change_orders" USING "btree" ("project_id");



CREATE INDEX "idx_po_checklist_items_completed_by" ON "public"."po_checklist_items" USING "btree" ("completed_by");



CREATE INDEX "idx_po_checklist_items_org_id" ON "public"."po_checklist_items" USING "btree" ("org_id");



CREATE INDEX "idx_po_chk_po" ON "public"."po_checklist_items" USING "btree" ("purchase_order_id", "position");



CREATE INDEX "idx_po_co_po" ON "public"."po_change_orders" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_po_co_status" ON "public"."po_change_orders" USING "btree" ("org_id", "status");



CREATE INDEX "idx_po_line_items_atom_id" ON "public"."po_line_items" USING "btree" ("atom_id");



CREATE INDEX "idx_po_line_items_xtc_code" ON "public"."po_line_items" USING "btree" ("xtc_code");



CREATE INDEX "idx_policies_org" ON "public"."governance_policies" USING "btree" ("org_id");



CREATE INDEX "idx_prequal_q_questionnaire" ON "public"."prequalification_questions" USING "btree" ("questionnaire_id", "position");



CREATE INDEX "idx_prequalification_questionnaires_created_by" ON "public"."prequalification_questionnaires" USING "btree" ("created_by");



CREATE INDEX "idx_prequalification_questions_org_id" ON "public"."prequalification_questions" USING "btree" ("org_id");



CREATE INDEX "idx_project_photos_location_id" ON "public"."project_photos" USING "btree" ("location_id");



CREATE INDEX "idx_project_photos_org_id" ON "public"."project_photos" USING "btree" ("org_id");



CREATE INDEX "idx_project_photos_project_id" ON "public"."project_photos" USING "btree" ("project_id");



CREATE INDEX "idx_project_photos_taken_by" ON "public"."project_photos" USING "btree" ("taken_by");



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_projects_primary_venue_id" ON "public"."projects" USING "btree" ("primary_venue_id");



CREATE INDEX "idx_proposal_activity_actor_id" ON "public"."proposal_activity" USING "btree" ("actor_id");



CREATE INDEX "idx_proposal_activity_org_id" ON "public"."proposal_activity" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_approvals_org_id" ON "public"."proposal_approvals" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_approvals_signed_by" ON "public"."proposal_approvals" USING "btree" ("signed_by");



CREATE INDEX "idx_proposal_change_orders_decided_by" ON "public"."proposal_change_orders" USING "btree" ("decided_by");



CREATE INDEX "idx_proposal_change_orders_org_id" ON "public"."proposal_change_orders" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_change_orders_requested_by" ON "public"."proposal_change_orders" USING "btree" ("requested_by");



CREATE INDEX "idx_proposal_events_proposal_id" ON "public"."proposal_events" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_files_org_id" ON "public"."proposal_files" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_files_uploaded_by" ON "public"."proposal_files" USING "btree" ("uploaded_by");



CREATE INDEX "idx_proposal_gate_items_done_by" ON "public"."proposal_gate_items" USING "btree" ("done_by");



CREATE INDEX "idx_proposal_gate_items_org_id" ON "public"."proposal_gate_items" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_gate_items_phase_state_id" ON "public"."proposal_gate_items" USING "btree" ("phase_state_id");



CREATE INDEX "idx_proposal_phase_states_approved_by" ON "public"."proposal_phase_states" USING "btree" ("approved_by");



CREATE INDEX "idx_proposal_phase_states_org_id" ON "public"."proposal_phase_states" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_revision_rounds_created_by" ON "public"."proposal_revision_rounds" USING "btree" ("created_by");



CREATE INDEX "idx_proposal_revision_rounds_decided_by" ON "public"."proposal_revision_rounds" USING "btree" ("decided_by");



CREATE INDEX "idx_proposal_revision_rounds_org_id" ON "public"."proposal_revision_rounds" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_revisions_created_by" ON "public"."proposal_revisions" USING "btree" ("created_by");



CREATE INDEX "idx_proposal_revisions_org_id" ON "public"."proposal_revisions" USING "btree" ("org_id");



CREATE INDEX "idx_proposal_revisions_proposal_id" ON "public"."proposal_revisions" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_revisions_round_id" ON "public"."proposal_revisions" USING "btree" ("round_id");



CREATE INDEX "idx_proposal_share_links_created_by" ON "public"."proposal_share_links" USING "btree" ("created_by");



CREATE INDEX "idx_proposal_signatures_proposal_id" ON "public"."proposal_signatures" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_versions_changed_by" ON "public"."proposal_versions" USING "btree" ("changed_by");



CREATE INDEX "idx_proposal_versions_proposal_id" ON "public"."proposal_versions" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposals_client_id" ON "public"."proposals" USING "btree" ("client_id");



CREATE INDEX "idx_proposals_created_by" ON "public"."proposals" USING "btree" ("created_by");



CREATE INDEX "idx_proposals_project_id" ON "public"."proposals" USING "btree" ("project_id");



CREATE INDEX "idx_punch_items_assignee" ON "public"."punch_items" USING "btree" ("assignee_id") WHERE ("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'ready_for_review'::"text"]));



CREATE INDEX "idx_punch_items_closed_by" ON "public"."punch_items" USING "btree" ("closed_by");



CREATE INDEX "idx_punch_items_created_by" ON "public"."punch_items" USING "btree" ("created_by");



CREATE INDEX "idx_punch_items_project_status" ON "public"."punch_items" USING "btree" ("project_id", "status");



CREATE INDEX "idx_punch_items_punch_list_id" ON "public"."punch_items" USING "btree" ("punch_list_id");



CREATE INDEX "idx_punch_items_site_plan_id" ON "public"."punch_items" USING "btree" ("site_plan_id");



CREATE INDEX "idx_punch_items_vendor_id" ON "public"."punch_items" USING "btree" ("vendor_id");



CREATE INDEX "idx_punch_lists_created_by" ON "public"."punch_lists" USING "btree" ("created_by");



CREATE INDEX "idx_punch_lists_org_id" ON "public"."punch_lists" USING "btree" ("org_id");



CREATE INDEX "idx_punch_lists_project_id" ON "public"."punch_lists" USING "btree" ("project_id");



CREATE INDEX "idx_purchase_orders_created_by" ON "public"."purchase_orders" USING "btree" ("created_by");



CREATE INDEX "idx_purchase_orders_project_id" ON "public"."purchase_orders" USING "btree" ("project_id");



CREATE INDEX "idx_purchase_orders_requisition_id" ON "public"."purchase_orders" USING "btree" ("requisition_id");



CREATE INDEX "idx_purchase_orders_vendor_id" ON "public"."purchase_orders" USING "btree" ("vendor_id");



CREATE INDEX "idx_rate_card_orders_delegation_id" ON "public"."rate_card_orders" USING "btree" ("delegation_id");



CREATE INDEX "idx_rentals_equipment_id" ON "public"."rentals" USING "btree" ("equipment_id");



CREATE INDEX "idx_rentals_project_id" ON "public"."rentals" USING "btree" ("project_id");



CREATE INDEX "idx_rentals_xpms_atom_id" ON "public"."rentals" USING "btree" ("xpms_atom_id");



CREATE INDEX "idx_requisitions_project_id" ON "public"."requisitions" USING "btree" ("project_id");



CREATE INDEX "idx_requisitions_requester_id" ON "public"."requisitions" USING "btree" ("requester_id");



CREATE INDEX "idx_rfis_answered_by" ON "public"."rfis" USING "btree" ("answered_by");



CREATE INDEX "idx_rfis_asked_by" ON "public"."rfis" USING "btree" ("asked_by");



CREATE INDEX "idx_rfis_ball_in_court" ON "public"."rfis" USING "btree" ("ball_in_court_id") WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_rfis_linked_deliverable_id" ON "public"."rfis" USING "btree" ("linked_deliverable_id");



CREATE INDEX "idx_rfis_linked_po_id" ON "public"."rfis" USING "btree" ("linked_po_id");



CREATE INDEX "idx_rfis_linked_site_plan_id" ON "public"."rfis" USING "btree" ("linked_site_plan_id");



CREATE INDEX "idx_rfis_project_id" ON "public"."rfis" USING "btree" ("project_id");



CREATE INDEX "idx_rfq_response_lines_org_id" ON "public"."rfq_response_lines" USING "btree" ("org_id");



CREATE INDEX "idx_rfq_response_lines_rfq_response_id" ON "public"."rfq_response_lines" USING "btree" ("rfq_response_id");



CREATE INDEX "idx_rfq_responses_awarded_by" ON "public"."rfq_responses" USING "btree" ("awarded_by");



CREATE INDEX "idx_rfq_responses_requisition_id" ON "public"."rfq_responses" USING "btree" ("requisition_id");



CREATE INDEX "idx_rfq_responses_vendor_id" ON "public"."rfq_responses" USING "btree" ("vendor_id");



CREATE INDEX "idx_rfqs_awarded_to_vendor_id" ON "public"."rfqs" USING "btree" ("awarded_to_vendor_id");



CREATE INDEX "idx_rfqs_created_by" ON "public"."rfqs" USING "btree" ("created_by");



CREATE INDEX "idx_rfqs_org_id" ON "public"."rfqs" USING "btree" ("org_id");



CREATE INDEX "idx_rfqs_project_id" ON "public"."rfqs" USING "btree" ("project_id");



CREATE INDEX "idx_rosters_venue_id" ON "public"."rosters" USING "btree" ("venue_id");



CREATE INDEX "idx_safety_briefing_attendees_briefing_id" ON "public"."safety_briefing_attendees" USING "btree" ("briefing_id");



CREATE INDEX "idx_safety_briefing_attendees_crew_member_id" ON "public"."safety_briefing_attendees" USING "btree" ("crew_member_id");



CREATE INDEX "idx_safety_briefing_attendees_org_id" ON "public"."safety_briefing_attendees" USING "btree" ("org_id");



CREATE INDEX "idx_safety_briefing_attendees_user_id" ON "public"."safety_briefing_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_safety_briefings_briefer_id" ON "public"."safety_briefings" USING "btree" ("briefer_id");



CREATE INDEX "idx_safety_briefings_created_by" ON "public"."safety_briefings" USING "btree" ("created_by");



CREATE INDEX "idx_safety_briefings_org_id" ON "public"."safety_briefings" USING "btree" ("org_id");



CREATE INDEX "idx_safety_briefings_project" ON "public"."safety_briefings" USING "btree" ("project_id", "scheduled_for" DESC);



CREATE INDEX "idx_safety_briefings_shift_id" ON "public"."safety_briefings" USING "btree" ("shift_id");



CREATE INDEX "idx_service_request_events_actor_id" ON "public"."service_request_events" USING "btree" ("actor_id");



CREATE INDEX "idx_service_request_events_org_id" ON "public"."service_request_events" USING "btree" ("org_id");



CREATE INDEX "idx_service_request_events_request_id" ON "public"."service_request_events" USING "btree" ("request_id");



CREATE INDEX "idx_service_requests_assigned_to" ON "public"."service_requests" USING "btree" ("assigned_to");



CREATE INDEX "idx_service_requests_org_status" ON "public"."service_requests" USING "btree" ("org_id", "status", "severity");



CREATE INDEX "idx_service_requests_project_id" ON "public"."service_requests" USING "btree" ("project_id");



CREATE INDEX "idx_service_requests_requester_id" ON "public"."service_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_service_requests_venue_id" ON "public"."service_requests" USING "btree" ("venue_id");



CREATE INDEX "idx_service_requests_zone_id" ON "public"."service_requests" USING "btree" ("zone_id");



CREATE INDEX "idx_shifts_roster_id" ON "public"."shifts" USING "btree" ("roster_id");



CREATE INDEX "idx_shifts_workforce_member_id" ON "public"."shifts" USING "btree" ("workforce_member_id");



CREATE INDEX "idx_shifts_zone_id" ON "public"."shifts" USING "btree" ("zone_id");



CREATE INDEX "idx_site_plan_pins_created_by" ON "public"."site_plan_pins" USING "btree" ("created_by");



CREATE INDEX "idx_site_plan_pins_org_id" ON "public"."site_plan_pins" USING "btree" ("org_id");



CREATE INDEX "idx_site_plan_pins_plan" ON "public"."site_plan_pins" USING "btree" ("site_plan_id");



CREATE INDEX "idx_site_plan_rev_plan" ON "public"."site_plan_revisions" USING "btree" ("site_plan_id");



CREATE INDEX "idx_site_plan_revisions_org_id" ON "public"."site_plan_revisions" USING "btree" ("org_id");



CREATE INDEX "idx_site_plan_revisions_uploaded_by" ON "public"."site_plan_revisions" USING "btree" ("uploaded_by");



CREATE INDEX "idx_site_plans_created_by" ON "public"."site_plans" USING "btree" ("created_by");



CREATE INDEX "idx_site_plans_current_revision_id" ON "public"."site_plans" USING "btree" ("current_revision_id");



CREATE INDEX "idx_site_plans_project" ON "public"."site_plans" USING "btree" ("project_id");



CREATE INDEX "idx_site_plans_venue_id" ON "public"."site_plans" USING "btree" ("venue_id");



CREATE INDEX "idx_submittal_revisions_org_id" ON "public"."submittal_revisions" USING "btree" ("org_id");



CREATE INDEX "idx_submittal_revisions_stamped_by" ON "public"."submittal_revisions" USING "btree" ("stamped_by");



CREATE INDEX "idx_submittal_revisions_submitted_by" ON "public"."submittal_revisions" USING "btree" ("submitted_by");



CREATE INDEX "idx_submittals_ball_in_court_id" ON "public"."submittals" USING "btree" ("ball_in_court_id");



CREATE INDEX "idx_submittals_created_by" ON "public"."submittals" USING "btree" ("created_by");



CREATE INDEX "idx_submittals_project_status" ON "public"."submittals" USING "btree" ("project_id", "status");



CREATE INDEX "idx_submittals_vendor_id" ON "public"."submittals" USING "btree" ("vendor_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_created_by" ON "public"."tasks" USING "btree" ("created_by");



CREATE INDEX "idx_tasks_xpms_atom_id" ON "public"."tasks" USING "btree" ("xpms_atom_id");



CREATE INDEX "idx_threats_org_status" ON "public"."threats" USING "btree" ("org_id", "status");



CREATE INDEX "idx_threats_owner_id" ON "public"."threats" USING "btree" ("owner_id");



CREATE INDEX "idx_ticket_scans_scanner_id" ON "public"."ticket_scans" USING "btree" ("scanner_id");



CREATE INDEX "idx_ticket_scans_ticket_id" ON "public"."ticket_scans" USING "btree" ("ticket_id");



CREATE INDEX "idx_tickets_scanned_by" ON "public"."tickets" USING "btree" ("scanned_by");



CREATE INDEX "idx_time_entries_atom_id" ON "public"."time_entries" USING "btree" ("atom_id");



CREATE INDEX "idx_time_entries_cost_code_id" ON "public"."time_entries" USING "btree" ("cost_code_id");



CREATE INDEX "idx_time_entries_project_id" ON "public"."time_entries" USING "btree" ("project_id");



CREATE INDEX "idx_time_entries_user_id" ON "public"."time_entries" USING "btree" ("user_id");



CREATE INDEX "idx_time_entries_xtc_code" ON "public"."time_entries" USING "btree" ("xtc_code");



CREATE INDEX "idx_user_preferences_last_org_id" ON "public"."user_preferences" USING "btree" ("last_org_id");



CREATE INDEX "idx_vendor_prequal_vendor" ON "public"."vendor_prequalifications" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendor_prequalification_answers_org_id" ON "public"."vendor_prequalification_answers" USING "btree" ("org_id");



CREATE INDEX "idx_vendor_prequalification_answers_question_id" ON "public"."vendor_prequalification_answers" USING "btree" ("question_id");



CREATE INDEX "idx_vendor_prequalifications_approved_by" ON "public"."vendor_prequalifications" USING "btree" ("approved_by");



CREATE INDEX "idx_vendor_prequalifications_questionnaire_id" ON "public"."vendor_prequalifications" USING "btree" ("questionnaire_id");



CREATE INDEX "idx_venue_build_log_created_by" ON "public"."venue_build_log" USING "btree" ("created_by");



CREATE INDEX "idx_venue_build_log_venue_id" ON "public"."venue_build_log" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_certifications_venue_id" ON "public"."venue_certifications" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_closeout_items_assignee_id" ON "public"."venue_closeout_items" USING "btree" ("assignee_id");



CREATE INDEX "idx_venue_closeout_items_created_by" ON "public"."venue_closeout_items" USING "btree" ("created_by");



CREATE INDEX "idx_venue_closeout_items_org_id" ON "public"."venue_closeout_items" USING "btree" ("org_id");



CREATE INDEX "idx_venue_closeout_items_venue_id" ON "public"."venue_closeout_items" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_design_specs_bom_requisition_id" ON "public"."venue_design_specs" USING "btree" ("bom_requisition_id");



CREATE INDEX "idx_venue_design_specs_created_by" ON "public"."venue_design_specs" USING "btree" ("created_by");



CREATE INDEX "idx_venue_design_specs_org_id" ON "public"."venue_design_specs" USING "btree" ("org_id");



CREATE INDEX "idx_venue_design_specs_venue_id" ON "public"."venue_design_specs" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_handover_items_assignee_id" ON "public"."venue_handover_items" USING "btree" ("assignee_id");



CREATE INDEX "idx_venue_handover_items_created_by" ON "public"."venue_handover_items" USING "btree" ("created_by");



CREATE INDEX "idx_venue_handover_items_org_id" ON "public"."venue_handover_items" USING "btree" ("org_id");



CREATE INDEX "idx_venue_handover_items_venue_id" ON "public"."venue_handover_items" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_vop_sections_approved_by" ON "public"."venue_vop_sections" USING "btree" ("approved_by");



CREATE INDEX "idx_venue_vop_sections_venue_id" ON "public"."venue_vop_sections" USING "btree" ("venue_id");



CREATE INDEX "idx_venue_zones_parent_zone_id" ON "public"."venue_zones" USING "btree" ("parent_zone_id");



CREATE INDEX "idx_visa_cases_delegation_id" ON "public"."visa_cases" USING "btree" ("delegation_id");



CREATE INDEX "idx_webauthn_challenges_user_id" ON "public"."webauthn_challenges" USING "btree" ("user_id");



CREATE INDEX "idx_webhook_deliveries_endpoint_id" ON "public"."webhook_deliveries" USING "btree" ("endpoint_id");



CREATE INDEX "idx_webhook_deliveries_org_id" ON "public"."webhook_deliveries" USING "btree" ("org_id");



CREATE INDEX "idx_webhook_endpoints_created_by" ON "public"."webhook_endpoints" USING "btree" ("created_by");



CREATE INDEX "idx_wob_invites_broadcast" ON "public"."work_order_broadcast_invites" USING "btree" ("broadcast_id");



CREATE INDEX "idx_wob_status" ON "public"."work_order_broadcasts" USING "btree" ("org_id", "status");



CREATE INDEX "idx_work_order_broadcast_invites_org_id" ON "public"."work_order_broadcast_invites" USING "btree" ("org_id");



CREATE INDEX "idx_work_order_broadcast_invites_vendor_id" ON "public"."work_order_broadcast_invites" USING "btree" ("vendor_id");



CREATE INDEX "idx_work_order_broadcasts_awarded_by" ON "public"."work_order_broadcasts" USING "btree" ("awarded_by");



CREATE INDEX "idx_work_order_broadcasts_awarded_to_vendor_id" ON "public"."work_order_broadcasts" USING "btree" ("awarded_to_vendor_id");



CREATE INDEX "idx_work_order_broadcasts_created_by" ON "public"."work_order_broadcasts" USING "btree" ("created_by");



CREATE INDEX "idx_work_order_broadcasts_project_id" ON "public"."work_order_broadcasts" USING "btree" ("project_id");



CREATE INDEX "idx_work_order_broadcasts_requisition_id" ON "public"."work_order_broadcasts" USING "btree" ("requisition_id");



CREATE INDEX "idx_workforce_deployments_venue_id" ON "public"."workforce_deployments" USING "btree" ("venue_id");



CREATE INDEX "idx_workforce_deployments_zone_id" ON "public"."workforce_deployments" USING "btree" ("zone_id");



CREATE INDEX "idx_workforce_members_venue_id" ON "public"."workforce_members" USING "btree" ("venue_id");



CREATE INDEX "idx_xpms_atoms_created_by" ON "public"."xpms_atoms" USING "btree" ("created_by");



CREATE INDEX "idx_xpms_atoms_division_code" ON "public"."xpms_atoms" USING "btree" ("division_code");



CREATE INDEX "idx_xpms_atoms_lineage_root_id" ON "public"."xpms_atoms" USING "btree" ("lineage_root_id");



CREATE INDEX "idx_xpms_atoms_owner_user_id" ON "public"."xpms_atoms" USING "btree" ("owner_user_id");



CREATE INDEX "idx_xpms_atoms_project_id" ON "public"."xpms_atoms" USING "btree" ("project_id");



CREATE INDEX "idx_xpms_atoms_section_code" ON "public"."xpms_atoms" USING "btree" ("section_code");



CREATE INDEX "idx_xpms_atoms_uac_origin_id" ON "public"."xpms_atoms" USING "btree" ("uac_origin_id");



CREATE INDEX "idx_xpms_atoms_xtc_code" ON "public"."xpms_atoms" USING "btree" ("xtc_code");



CREATE INDEX "idx_xpms_provenance_edges_created_by" ON "public"."xpms_provenance_edges" USING "btree" ("created_by");



CREATE INDEX "idx_xpms_provenance_edges_org_id" ON "public"."xpms_provenance_edges" USING "btree" ("org_id");



CREATE INDEX "idx_xpms_provenance_edges_to_atom_id" ON "public"."xpms_provenance_edges" USING "btree" ("to_atom_id");



CREATE INDEX "idx_xpms_variance_ledger_org_id" ON "public"."xpms_variance_ledger" USING "btree" ("org_id");



CREATE INDEX "idx_xpms_variance_ledger_recorded_by" ON "public"."xpms_variance_ledger" USING "btree" ("recorded_by");



CREATE INDEX "idx_xpms_variance_ledger_tpc_atom_id" ON "public"."xpms_variance_ledger" USING "btree" ("tpc_atom_id");



CREATE INDEX "idx_xpms_variance_ledger_uac_atom_id" ON "public"."xpms_variance_ledger" USING "btree" ("uac_atom_id");



CREATE INDEX "import_jobs_org_state_idx" ON "public"."import_jobs" USING "btree" ("org_id", "state", "created_at" DESC);



CREATE INDEX "import_jobs_pending_idx" ON "public"."import_jobs" USING "btree" ("id") WHERE ("state" = ANY (ARRAY['pending'::"public"."import_job_state", 'parsing'::"public"."import_job_state", 'inserting'::"public"."import_job_state"]));



CREATE INDEX "incidents_closed_at_idx" ON "public"."incidents" USING "btree" ("closed_at") WHERE ("closed_at" IS NOT NULL);



CREATE INDEX "incidents_org_status_idx" ON "public"."incidents" USING "btree" ("org_id", "status");



CREATE UNIQUE INDEX "integration_connectors_slug_idx" ON "public"."integration_connectors" USING "btree" ("org_id", "slug");



CREATE UNIQUE INDEX "invites_org_email_pending_idx" ON "public"."invites" USING "btree" ("org_id", "lower"("email")) WHERE ("status" = 'pending'::"text");



CREATE INDEX "invites_org_status_idx" ON "public"."invites" USING "btree" ("org_id", "status");



CREATE INDEX "invoices_org_idx" ON "public"."invoices" USING "btree" ("org_id");



CREATE UNIQUE INDEX "job_queue_dedup_idx" ON "public"."job_queue" USING "btree" ("type", "dedup_key") WHERE (("state" = ANY (ARRAY['pending'::"public"."job_state", 'running'::"public"."job_state"])) AND ("dedup_key" IS NOT NULL));



CREATE UNIQUE INDEX "kb_articles_slug_idx" ON "public"."kb_articles" USING "btree" ("org_id", "slug");



CREATE INDEX "leads_org_idx" ON "public"."leads" USING "btree" ("org_id");



CREATE INDEX "locations_org_idx" ON "public"."locations" USING "btree" ("org_id");



CREATE UNIQUE INDEX "locations_org_name_idx" ON "public"."locations" USING "btree" ("org_id", "name");



CREATE INDEX "major_incidents_incident_idx" ON "public"."major_incidents" USING "btree" ("incident_id");



CREATE INDEX "medical_encounters_incident_idx" ON "public"."medical_encounters" USING "btree" ("incident_id");



CREATE INDEX "memberships_org_idx" ON "public"."memberships" USING "btree" ("org_id");



CREATE INDEX "memberships_user_idx" ON "public"."memberships" USING "btree" ("user_id");



CREATE INDEX "mfa_recovery_codes_user_idx" ON "public"."mfa_recovery_codes" USING "btree" ("user_id") WHERE ("used_at" IS NULL);



CREATE INDEX "mileage_org_idx" ON "public"."mileage_logs" USING "btree" ("org_id");



CREATE INDEX "notifications_user_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "notifications_user_unread_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at") WHERE (("read_at" IS NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "offer_letter_activity_letter_idx" ON "public"."offer_letter_activity" USING "btree" ("offer_letter_id", "occurred_at" DESC);



CREATE INDEX "offer_letters_crew_idx" ON "public"."offer_letters" USING "btree" ("crew_member_id");



CREATE INDEX "offer_letters_project_idx" ON "public"."offer_letters" USING "btree" ("project_id");



CREATE INDEX "offer_letters_status_idx" ON "public"."offer_letters" USING "btree" ("status");



CREATE INDEX "offer_letters_token_idx" ON "public"."offer_letters" USING "btree" ("public_token");



CREATE INDEX "org_event_log_dest_org_idx" ON "public"."org_event_log_destinations" USING "btree" ("org_id") WHERE ("enabled" = true);



CREATE INDEX "org_ip_allowlist_org_idx" ON "public"."org_ip_allowlist" USING "btree" ("org_id") WHERE ("enabled" = true);



CREATE INDEX "org_scim_tokens_token_hash_idx" ON "public"."org_scim_tokens" USING "btree" ("token_hash") WHERE ("enabled" = true);



CREATE INDEX "org_sequences_org_idx" ON "public"."org_sequences" USING "btree" ("org_id");



CREATE INDEX "org_sso_providers_email_domains_idx" ON "public"."org_sso_providers" USING "gin" ("email_domains");



CREATE INDEX "org_sso_providers_org_idx" ON "public"."org_sso_providers" USING "btree" ("org_id");



CREATE INDEX "po_line_items_po_idx" ON "public"."po_line_items" USING "btree" ("purchase_order_id");



CREATE INDEX "pos_org_idx" ON "public"."purchase_orders" USING "btree" ("org_id");



CREATE INDEX "project_members_project_idx" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "project_members_user_idx" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "project_templates_category_idx" ON "public"."project_templates" USING "btree" ("category") WHERE ("enabled" = true);



CREATE UNIQUE INDEX "project_templates_global_slug_idx" ON "public"."project_templates" USING "btree" ("slug") WHERE ("org_id" IS NULL);



CREATE INDEX "project_templates_org_idx" ON "public"."project_templates" USING "btree" ("org_id") WHERE ("org_id" IS NOT NULL);



CREATE INDEX "proposal_activity_proposal_idx" ON "public"."proposal_activity" USING "btree" ("proposal_id", "occurred_at" DESC);



CREATE INDEX "proposal_approvals_proposal_idx" ON "public"."proposal_approvals" USING "btree" ("proposal_id");



CREATE INDEX "proposal_change_orders_proposal_idx" ON "public"."proposal_change_orders" USING "btree" ("proposal_id");



CREATE INDEX "proposal_files_proposal_idx" ON "public"."proposal_files" USING "btree" ("proposal_id");



CREATE INDEX "proposal_gate_items_proposal_idx" ON "public"."proposal_gate_items" USING "btree" ("proposal_id");



CREATE INDEX "proposal_phase_states_proposal_idx" ON "public"."proposal_phase_states" USING "btree" ("proposal_id");



CREATE INDEX "proposal_revision_rounds_proposal_idx" ON "public"."proposal_revision_rounds" USING "btree" ("proposal_id");



CREATE INDEX "proposal_share_links_proposal_idx" ON "public"."proposal_share_links" USING "btree" ("proposal_id");



CREATE INDEX "proposal_share_links_token_idx" ON "public"."proposal_share_links" USING "btree" ("token");



CREATE UNIQUE INDEX "proposals_org_doc_number_idx" ON "public"."proposals" USING "btree" ("org_id", "doc_number") WHERE ("doc_number" IS NOT NULL);



CREATE INDEX "punch_items_closed_at_idx" ON "public"."punch_items" USING "btree" ("closed_at") WHERE ("closed_at" IS NOT NULL);



CREATE INDEX "push_subscriptions_user_idx" ON "public"."push_subscriptions" USING "btree" ("user_id") WHERE ("disabled_at" IS NULL);



CREATE UNIQUE INDEX "rate_card_items_org_sku_idx" ON "public"."rate_card_items" USING "btree" ("org_id", "sku");



CREATE UNIQUE INDEX "rate_card_items_sku_idx" ON "public"."rate_card_items" USING "btree" ("org_id", "catalog", "sku");



CREATE INDEX "record_grants_resource_idx" ON "public"."record_grants" USING "btree" ("resource_table", "resource_id");



CREATE INDEX "record_grants_team_idx" ON "public"."record_grants" USING "btree" ("team_id") WHERE ("team_id" IS NOT NULL);



CREATE INDEX "record_grants_user_idx" ON "public"."record_grants" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "rentals_org_idx" ON "public"."rentals" USING "btree" ("org_id");



CREATE INDEX "requisitions_org_idx" ON "public"."requisitions" USING "btree" ("org_id");



CREATE INDEX "rfis_closed_at_idx" ON "public"."rfis" USING "btree" ("closed_at") WHERE ("closed_at" IS NOT NULL);



CREATE INDEX "risks_org_status_idx" ON "public"."risks" USING "btree" ("org_id", "status");



CREATE INDEX "share_links_active_idx" ON "public"."share_links" USING "btree" ("id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "share_links_org_idx" ON "public"."share_links" USING "btree" ("org_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "share_links_resource_idx" ON "public"."share_links" USING "btree" ("resource_table", "resource_id");



CREATE INDEX "shifts_venue_day_idx" ON "public"."shifts" USING "btree" ("venue_id", "starts_at");



CREATE INDEX "slack_channel_mappings_workspace_idx" ON "public"."slack_channel_mappings" USING "btree" ("workspace_id") WHERE ("enabled" = true);



CREATE INDEX "slack_user_links_workspace_idx" ON "public"."slack_user_links" USING "btree" ("workspace_id");



CREATE INDEX "submittals_closed_at_idx" ON "public"."submittals" USING "btree" ("closed_at") WHERE ("closed_at" IS NOT NULL);



CREATE INDEX "tasks_org_idx" ON "public"."tasks" USING "btree" ("org_id");



CREATE INDEX "tasks_project_idx" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "team_members_user_idx" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "teams_org_idx" ON "public"."teams" USING "btree" ("org_id");



CREATE INDEX "tickets_project_idx" ON "public"."tickets" USING "btree" ("project_id");



CREATE INDEX "time_entries_org_idx" ON "public"."time_entries" USING "btree" ("org_id");



CREATE INDEX "user_passkeys_user_idx" ON "public"."user_passkeys" USING "btree" ("user_id");



CREATE INDEX "vendors_org_idx" ON "public"."vendors" USING "btree" ("org_id");



CREATE UNIQUE INDEX "venue_zones_venue_code_idx" ON "public"."venue_zones" USING "btree" ("venue_id", "code");



CREATE INDEX "venues_org_kind_idx" ON "public"."venues" USING "btree" ("org_id", "kind");



CREATE UNIQUE INDEX "venues_org_project_name_idx" ON "public"."venues" USING "btree" ("org_id", "project_id", "name");



CREATE INDEX "view_configs_creator_idx" ON "public"."view_configs" USING "btree" ("created_by") WHERE ("scope" = 'private'::"public"."view_scope");



CREATE INDEX "view_configs_org_table_idx" ON "public"."view_configs" USING "btree" ("org_id", "table_id");



CREATE INDEX "webhook_endpoints_org_idx" ON "public"."webhook_endpoints" USING "btree" ("org_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "workforce_members_org_kind_idx" ON "public"."workforce_members" USING "btree" ("org_id", "kind");



CREATE UNIQUE INDEX "xpms_atom_tiers_one_primary" ON "public"."xpms_atom_tiers" USING "btree" ("atom_id") WHERE "is_primary";



CREATE INDEX "xpms_atoms_class_idx" ON "public"."xpms_atoms" USING "btree" ("class_code");



CREATE INDEX "xtc_codes_face_idx" ON "public"."xtc_codes" USING "btree" ("face");



CREATE OR REPLACE TRIGGER "annotations_notify_trg" AFTER INSERT OR UPDATE ON "public"."annotations" FOR EACH ROW EXECUTE FUNCTION "public"."annotations_notify"();



CREATE OR REPLACE TRIGGER "annotations_touch_updated_at" BEFORE UPDATE ON "public"."annotations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "audit_ai_messages" AFTER INSERT OR DELETE OR UPDATE ON "public"."ai_messages" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_budgets" AFTER INSERT OR DELETE OR UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_clients" AFTER INSERT OR DELETE OR UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_credentials" AFTER INSERT OR DELETE OR UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_crew_members" AFTER INSERT OR DELETE OR UPDATE ON "public"."crew_members" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_deliverable_comments" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverable_comments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_deliverables" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_equipment" AFTER INSERT OR DELETE OR UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_event_guides" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_guides" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_expenses" AFTER INSERT OR DELETE OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_fabrication_orders" AFTER INSERT OR DELETE OR UPDATE ON "public"."fabrication_orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_invoice_line_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_invoices" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_leads" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_locations" AFTER INSERT OR DELETE OR UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_memberships" AFTER INSERT OR DELETE OR UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_mileage_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."mileage_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_orgs" AFTER INSERT OR DELETE OR UPDATE ON "public"."orgs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_po_line_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."po_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_projects" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_proposals" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_purchase_orders" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_rentals" AFTER INSERT OR DELETE OR UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_requisitions" AFTER INSERT OR DELETE OR UPDATE ON "public"."requisitions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."access_scans" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."accommodation_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."accreditation_categories" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."accreditation_changes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."accreditations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."ad_manifests" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."api_keys" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."asset_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."automations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."consent_records" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."cost_codes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."crew_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."crisis_alert_receipts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."crisis_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."cues" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_log_deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_log_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_log_manpower" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_log_photos" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_log_visitors" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."daily_logs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."delegation_entries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."delegations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverable_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."dispatch_runs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."dsar_requests" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."environmental_events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_guides" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."export_runs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."fabrication_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."form_defs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."governance_committees" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."governance_policies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."guard_tours" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."guide_comments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."idempotency_keys" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."import_runs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."incidents" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."inspection_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."inspection_template_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."inspection_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."inspections" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."insurance_policies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."integration_connectors" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."invites" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."itil_changes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."itil_problems" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."kb_articles" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."maintenance_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."maintenance_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."major_incidents" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."medical_encounters" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."mileage_logs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_letter_activity" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_letters" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."org_domains" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."org_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."org_offer_letter_settings" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."org_roles" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."payment_application_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."payment_applications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."playbooks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."po_change_order_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."po_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."po_checklist_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."prequalification_questionnaires" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."prequalification_questions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."program_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_photos" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_activity" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_files" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_gate_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_phase_states" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_revision_rounds" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposal_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."punch_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."punch_lists" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rate_card_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rate_card_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rate_limit_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."readiness_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."requisitions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rfis" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rfq_response_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rfq_responses" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rfqs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."risks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."rosters" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."safeguarding_reports" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."safety_briefing_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."safety_briefings" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."service_request_events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."service_sla_policies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."shifts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_plan_pins" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_plan_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."site_plans" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."sponsor_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."stage_plots" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."submittal_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."submittals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."sustainability_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."threats" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."ticket_types" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."trademarks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."usage_events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."usage_rollups" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."vendor_prequalification_answers" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."vendor_prequalifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_build_log" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_certifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_closeout_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_design_specs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_handover_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_vop_sections" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venue_zones" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."venues" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."visa_cases" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."webhook_deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."webhook_endpoints" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."work_order_broadcast_invites" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."work_order_broadcasts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."workforce_deployments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_rows" AFTER INSERT OR DELETE OR UPDATE ON "public"."workforce_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();



CREATE OR REPLACE TRIGGER "audit_tasks" AFTER INSERT OR DELETE OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_tickets" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_time_entries" AFTER INSERT OR DELETE OR UPDATE ON "public"."time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_vendors" AFTER INSERT OR DELETE OR UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_xpms_atom_tiers" AFTER INSERT OR DELETE OR UPDATE ON "public"."xpms_atom_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_xpms_atoms" AFTER INSERT OR DELETE OR UPDATE ON "public"."xpms_atoms" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_xpms_project_composition" AFTER INSERT OR DELETE OR UPDATE ON "public"."xpms_project_composition" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_xpms_provenance_edges" AFTER INSERT OR DELETE OR UPDATE ON "public"."xpms_provenance_edges" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_xpms_variance_ledger" AFTER INSERT OR DELETE OR UPDATE ON "public"."xpms_variance_ledger" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "check_deliverable_deadline" BEFORE UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_deliverable_deadline"();



CREATE OR REPLACE TRIGGER "check_vendor_compliance" BEFORE INSERT OR UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_check_vendor_compliance"();



CREATE OR REPLACE TRIGGER "compute_time_entry_duration" BEFORE INSERT OR UPDATE ON "public"."time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_compute_time_entry_duration"();



CREATE OR REPLACE TRIGGER "dashboards_updated_at_tg" BEFORE UPDATE ON "public"."dashboards" FOR EACH ROW EXECUTE FUNCTION "public"."tg_dashboards_updated_at"();



CREATE OR REPLACE TRIGGER "deliverable_submit_snapshot" BEFORE UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."snapshot_deliverable_on_submit"();



CREATE OR REPLACE TRIGGER "deliverables_touch_updated_at" BEFORE UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "event_guides_touch_updated_at" BEFORE UPDATE ON "public"."event_guides" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "expenses_touch_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "import_jobs_updated_at_tg" BEFORE UPDATE ON "public"."import_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_import_jobs_updated_at"();



CREATE OR REPLACE TRIGGER "invoices_touch_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "job_queue_updated_at" BEFORE UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."bump_updated_at"();



CREATE OR REPLACE TRIGGER "leads_touch_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "offer_letters_snapshot_trg" BEFORE UPDATE ON "public"."offer_letters" FOR EACH ROW EXECUTE FUNCTION "public"."snapshot_offer_letter"();



CREATE OR REPLACE TRIGGER "offer_letters_touch_updated_at" BEFORE UPDATE ON "public"."offer_letters" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "pos_touch_updated_at" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "project_members_updated_at" BEFORE UPDATE ON "public"."project_members" FOR EACH ROW EXECUTE FUNCTION "public"."project_members_touch_updated_at"();



CREATE OR REPLACE TRIGGER "project_templates_updated_at_tg" BEFORE UPDATE ON "public"."project_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_project_templates_updated_at"();



CREATE OR REPLACE TRIGGER "projects_touch_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposal_approvals_touch_updated_at" BEFORE UPDATE ON "public"."proposal_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposal_change_orders_number_trg" BEFORE INSERT ON "public"."proposal_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."proposal_change_orders_number"();



CREATE OR REPLACE TRIGGER "proposal_change_orders_touch_updated_at" BEFORE UPDATE ON "public"."proposal_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposal_gate_items_touch_updated_at" BEFORE UPDATE ON "public"."proposal_gate_items" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposal_phase_states_touch_updated_at" BEFORE UPDATE ON "public"."proposal_phase_states" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposal_revision_rounds_touch_updated_at" BEFORE UPDATE ON "public"."proposal_revision_rounds" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "proposals_touch_updated_at" BEFORE UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."accreditations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."automations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."cost_codes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."credentials" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."crew_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."cues" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."daily_logs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."delegations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."deliverable_comments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."deliverable_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."deliverables" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."dsar_requests" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."event_guides" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."fabrication_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."form_defs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."guard_tours" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."guide_comments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."incidents" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."inspection_templates" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."inspections" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."integration_connectors" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."itil_changes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."itil_problems" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."kb_articles" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."maintenance_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."maintenance_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."mileage_logs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."offer_letters" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."org_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."org_offer_letter_settings" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."orgs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."payment_applications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."playbooks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."po_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."po_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."prequalification_questionnaires" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."program_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_gate_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_phase_states" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_revision_rounds" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_share_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposal_versions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."punch_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."punch_lists" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rate_card_orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rate_limit_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."readiness_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."requisitions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rfis" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rfq_responses" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rfqs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."risks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rosters" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."safeguarding_reports" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."safety_briefings" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."service_sla_policies" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."site_plan_revisions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."site_plans" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."sponsor_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."stage_plots" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."submittals" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."threats" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."time_entries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."usage_rollups" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_passkeys" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."vendor_prequalifications" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."venue_closeout_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."venue_design_specs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."venue_handover_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."venue_vop_sections" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."venues" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."visa_cases" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."webhook_endpoints" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."work_order_broadcasts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."workforce_members" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "share_links_updated_at_tg" BEFORE UPDATE ON "public"."share_links" FOR EACH ROW EXECUTE FUNCTION "public"."tg_share_links_updated_at"();



CREATE OR REPLACE TRIGGER "sync_budget_spent_on_expense" AFTER INSERT OR DELETE OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_budget_spent_on_expense"();



CREATE OR REPLACE TRIGGER "sync_budget_spent_on_invoice" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_budget_spent_on_invoice"();



CREATE OR REPLACE TRIGGER "tasks_touch_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "teams_updated_at_tg" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."tg_teams_updated_at"();



CREATE OR REPLACE TRIGGER "trg_service_request_set_sla" BEFORE INSERT ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."service_request_set_sla"();



CREATE OR REPLACE TRIGGER "view_configs_updated_at_tg" BEFORE UPDATE ON "public"."view_configs" FOR EACH ROW EXECUTE FUNCTION "public"."tg_view_configs_updated_at"();



CREATE OR REPLACE TRIGGER "xpms_atoms_touch_updated_at" BEFORE UPDATE ON "public"."xpms_atoms" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



ALTER TABLE ONLY "public"."access_scans"
    ADD CONSTRAINT "access_scans_accreditation_id_fkey" FOREIGN KEY ("accreditation_id") REFERENCES "public"."accreditations"("id");



ALTER TABLE ONLY "public"."access_scans"
    ADD CONSTRAINT "access_scans_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."access_scans"
    ADD CONSTRAINT "access_scans_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."venue_zones"("id");



ALTER TABLE ONLY "public"."accreditation_changes"
    ADD CONSTRAINT "accreditation_changes_accreditation_id_fkey" FOREIGN KEY ("accreditation_id") REFERENCES "public"."accreditations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accreditations"
    ADD CONSTRAINT "accreditations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."accreditation_categories"("id");



ALTER TABLE ONLY "public"."ad_manifests"
    ADD CONSTRAINT "ad_manifests_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "public"."delegations"("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotation_watchers"
    ADD CONSTRAINT "annotation_watchers_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "public"."annotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotation_watchers"
    ADD CONSTRAINT "annotation_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_linked_task_id_fkey" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."annotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_links"
    ADD CONSTRAINT "asset_links_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_links"
    ADD CONSTRAINT "asset_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_runs"
    ADD CONSTRAINT "automation_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_schedules"
    ADD CONSTRAINT "automation_schedules_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_step_runs"
    ADD CONSTRAINT "automation_step_runs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."automation_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_subscriptions"
    ADD CONSTRAINT "automation_subscriptions_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automation_subscriptions"
    ADD CONSTRAINT "automation_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_codes"
    ADD CONSTRAINT "cost_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cost_codes"
    ADD CONSTRAINT "cost_codes_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credentials"
    ADD CONSTRAINT "credentials_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_xpms_atom_id_fkey" FOREIGN KEY ("xpms_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crisis_alert_receipts"
    ADD CONSTRAINT "crisis_alert_receipts_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "public"."crisis_alerts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cues"
    ADD CONSTRAINT "cues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cues"
    ADD CONSTRAINT "cues_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cues"
    ADD CONSTRAINT "cues_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cues"
    ADD CONSTRAINT "cues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daily_log_deliveries"
    ADD CONSTRAINT "daily_log_deliveries_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_deliveries"
    ADD CONSTRAINT "daily_log_deliveries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_deliveries"
    ADD CONSTRAINT "daily_log_deliveries_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_log_deliveries"
    ADD CONSTRAINT "daily_log_deliveries_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_log_equipment"
    ADD CONSTRAINT "daily_log_equipment_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_equipment"
    ADD CONSTRAINT "daily_log_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_log_equipment"
    ADD CONSTRAINT "daily_log_equipment_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_manpower"
    ADD CONSTRAINT "daily_log_manpower_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_manpower"
    ADD CONSTRAINT "daily_log_manpower_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_manpower"
    ADD CONSTRAINT "daily_log_manpower_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_log_photos"
    ADD CONSTRAINT "daily_log_photos_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_photos"
    ADD CONSTRAINT "daily_log_photos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_photos"
    ADD CONSTRAINT "daily_log_photos_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_log_visitors"
    ADD CONSTRAINT "daily_log_visitors_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "public"."daily_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_log_visitors"
    ADD CONSTRAINT "daily_log_visitors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_logs"
    ADD CONSTRAINT "daily_logs_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delegation_entries"
    ADD CONSTRAINT "delegation_entries_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "public"."delegations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverable_comments"
    ADD CONSTRAINT "deliverable_comments_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverable_comments"
    ADD CONSTRAINT "deliverable_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverable_history"
    ADD CONSTRAINT "deliverable_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."deliverable_history"
    ADD CONSTRAINT "deliverable_history_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."deliverables"
    ADD CONSTRAINT "deliverables_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatch_runs"
    ADD CONSTRAINT "dispatch_runs_destination_venue_id_fkey" FOREIGN KEY ("destination_venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."dispatch_runs"
    ADD CONSTRAINT "dispatch_runs_origin_venue_id_fkey" FOREIGN KEY ("origin_venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."domain_events"
    ADD CONSTRAINT "domain_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."environmental_events"
    ADD CONSTRAINT "environmental_events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_xpms_atom_id_fkey" FOREIGN KEY ("xpms_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_guides"
    ADD CONSTRAINT "event_guides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."event_guides"
    ADD CONSTRAINT "event_guides_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_guides"
    ADD CONSTRAINT "event_guides_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fabrication_orders"
    ADD CONSTRAINT "fabrication_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fabrication_orders"
    ADD CONSTRAINT "fabrication_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fabrication_orders"
    ADD CONSTRAINT "fabrication_orders_xpms_atom_id_fkey" FOREIGN KEY ("xpms_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fabrication_orders"
    ADD CONSTRAINT "fabrication_orders_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."form_defs"
    ADD CONSTRAINT "form_defs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."form_defs"
    ADD CONSTRAINT "form_defs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."form_defs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."governance_committees"
    ADD CONSTRAINT "governance_committees_chair_user_id_fkey" FOREIGN KEY ("chair_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."governance_committees"
    ADD CONSTRAINT "governance_committees_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."governance_policies"
    ADD CONSTRAINT "governance_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."governance_policies"
    ADD CONSTRAINT "governance_policies_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."guard_tours"
    ADD CONSTRAINT "guard_tours_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."guard_tours"
    ADD CONSTRAINT "guard_tours_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guard_tours"
    ADD CONSTRAINT "guard_tours_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."guide_comments"
    ADD CONSTRAINT "guide_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."guide_comments"
    ADD CONSTRAINT "guide_comments_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "public"."event_guides"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guide_comments"
    ADD CONSTRAINT "guide_comments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guide_comments"
    ADD CONSTRAINT "guide_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."guide_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_runs"
    ADD CONSTRAINT "import_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."import_runs"
    ADD CONSTRAINT "import_runs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_items"
    ADD CONSTRAINT "inspection_items_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_items"
    ADD CONSTRAINT "inspection_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_items"
    ADD CONSTRAINT "inspection_items_template_item_id_fkey" FOREIGN KEY ("template_item_id") REFERENCES "public"."inspection_template_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_template_items"
    ADD CONSTRAINT "inspection_template_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_template_items"
    ADD CONSTRAINT "inspection_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_templates"
    ADD CONSTRAINT "inspection_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_templates"
    ADD CONSTRAINT "inspection_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."itil_changes"
    ADD CONSTRAINT "itil_changes_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_linked_change_id_fkey" FOREIGN KEY ("linked_change_id") REFERENCES "public"."itil_changes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_linked_incident_id_fkey" FOREIGN KEY ("linked_incident_id") REFERENCES "public"."incidents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itil_problems"
    ADD CONSTRAINT "itil_problems_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_jobs"
    ADD CONSTRAINT "maintenance_jobs_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."maintenance_jobs"
    ADD CONSTRAINT "maintenance_jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_jobs"
    ADD CONSTRAINT "maintenance_jobs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."maintenance_schedules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_schedules"
    ADD CONSTRAINT "maintenance_schedules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_schedules"
    ADD CONSTRAINT "maintenance_schedules_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."major_incidents"
    ADD CONSTRAINT "major_incidents_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."medical_encounters"
    ADD CONSTRAINT "medical_encounters_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id");



ALTER TABLE ONLY "public"."medical_encounters"
    ADD CONSTRAINT "medical_encounters_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mfa_recovery_codes"
    ADD CONSTRAINT "mfa_recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mileage_logs"
    ADD CONSTRAINT "mileage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_letter_activity"
    ADD CONSTRAINT "offer_letter_activity_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."offer_letter_activity"
    ADD CONSTRAINT "offer_letter_activity_offer_letter_id_fkey" FOREIGN KEY ("offer_letter_id") REFERENCES "public"."offer_letters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_letter_activity"
    ADD CONSTRAINT "offer_letter_activity_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_per_diem_rate_card_item_id_fkey" FOREIGN KEY ("per_diem_rate_card_item_id") REFERENCES "public"."rate_card_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_rate_card_item_id_fkey" FOREIGN KEY ("rate_card_item_id") REFERENCES "public"."rate_card_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_reports_to_crew_member_id_fkey" FOREIGN KEY ("reports_to_crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."org_roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."offer_letters"
    ADD CONSTRAINT "offer_letters_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_domains"
    ADD CONSTRAINT "org_domains_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_event_log_destinations"
    ADD CONSTRAINT "org_event_log_destinations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_ip_allowlist"
    ADD CONSTRAINT "org_ip_allowlist_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_offer_letter_settings"
    ADD CONSTRAINT "org_offer_letter_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_offer_letter_settings"
    ADD CONSTRAINT "org_offer_letter_settings_signing_authority_fkey" FOREIGN KEY ("signing_authority_crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_roles"
    ADD CONSTRAINT "org_roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_scim_tokens"
    ADD CONSTRAINT "org_scim_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_scim_tokens"
    ADD CONSTRAINT "org_scim_tokens_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_sequences"
    ADD CONSTRAINT "org_sequences_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_sso_providers"
    ADD CONSTRAINT "org_sso_providers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_application_lines"
    ADD CONSTRAINT "payment_application_lines_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_application_lines"
    ADD CONSTRAINT "payment_application_lines_payment_application_id_fkey" FOREIGN KEY ("payment_application_id") REFERENCES "public"."payment_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_application_lines"
    ADD CONSTRAINT "payment_application_lines_po_line_item_id_fkey" FOREIGN KEY ("po_line_item_id") REFERENCES "public"."po_line_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "payment_applications_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playbooks"
    ADD CONSTRAINT "playbooks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."po_change_order_lines"
    ADD CONSTRAINT "po_change_order_lines_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_change_order_lines"
    ADD CONSTRAINT "po_change_order_lines_po_change_order_id_fkey" FOREIGN KEY ("po_change_order_id") REFERENCES "public"."po_change_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_change_orders"
    ADD CONSTRAINT "po_change_orders_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_checklist_items"
    ADD CONSTRAINT "po_checklist_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."po_checklist_items"
    ADD CONSTRAINT "po_checklist_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_checklist_items"
    ADD CONSTRAINT "po_checklist_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_line_items"
    ADD CONSTRAINT "po_line_items_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."po_line_items"
    ADD CONSTRAINT "po_line_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_line_items"
    ADD CONSTRAINT "po_line_items_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prequalification_questionnaires"
    ADD CONSTRAINT "prequalification_questionnaires_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prequalification_questionnaires"
    ADD CONSTRAINT "prequalification_questionnaires_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prequalification_questions"
    ADD CONSTRAINT "prequalification_questions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prequalification_questions"
    ADD CONSTRAINT "prequalification_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."prequalification_questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_photos"
    ADD CONSTRAINT "project_photos_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_photos"
    ADD CONSTRAINT "project_photos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_photos"
    ADD CONSTRAINT "project_photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_photos"
    ADD CONSTRAINT "project_photos_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_primary_venue_id_fkey" FOREIGN KEY ("primary_venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposal_activity"
    ADD CONSTRAINT "proposal_activity_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_activity"
    ADD CONSTRAINT "proposal_activity_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_activity"
    ADD CONSTRAINT "proposal_activity_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_approvals"
    ADD CONSTRAINT "proposal_approvals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_approvals"
    ADD CONSTRAINT "proposal_approvals_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_approvals"
    ADD CONSTRAINT "proposal_approvals_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_change_orders"
    ADD CONSTRAINT "proposal_change_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_events"
    ADD CONSTRAINT "proposal_events_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_files"
    ADD CONSTRAINT "proposal_files_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_files"
    ADD CONSTRAINT "proposal_files_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_files"
    ADD CONSTRAINT "proposal_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_gate_items"
    ADD CONSTRAINT "proposal_gate_items_done_by_fkey" FOREIGN KEY ("done_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_gate_items"
    ADD CONSTRAINT "proposal_gate_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_gate_items"
    ADD CONSTRAINT "proposal_gate_items_phase_state_id_fkey" FOREIGN KEY ("phase_state_id") REFERENCES "public"."proposal_phase_states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_gate_items"
    ADD CONSTRAINT "proposal_gate_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_phase_states"
    ADD CONSTRAINT "proposal_phase_states_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_phase_states"
    ADD CONSTRAINT "proposal_phase_states_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_phase_states"
    ADD CONSTRAINT "proposal_phase_states_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_revision_rounds"
    ADD CONSTRAINT "proposal_revision_rounds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_revision_rounds"
    ADD CONSTRAINT "proposal_revision_rounds_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_revision_rounds"
    ADD CONSTRAINT "proposal_revision_rounds_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_revision_rounds"
    ADD CONSTRAINT "proposal_revision_rounds_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_revisions"
    ADD CONSTRAINT "proposal_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_revisions"
    ADD CONSTRAINT "proposal_revisions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_revisions"
    ADD CONSTRAINT "proposal_revisions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_revisions"
    ADD CONSTRAINT "proposal_revisions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."proposal_revision_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_share_links"
    ADD CONSTRAINT "proposal_share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_share_links"
    ADD CONSTRAINT "proposal_share_links_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_signatures"
    ADD CONSTRAINT "proposal_signatures_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_punch_list_id_fkey" FOREIGN KEY ("punch_list_id") REFERENCES "public"."punch_lists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_site_plan_id_fkey" FOREIGN KEY ("site_plan_id") REFERENCES "public"."site_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_items"
    ADD CONSTRAINT "punch_items_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_lists"
    ADD CONSTRAINT "punch_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."punch_lists"
    ADD CONSTRAINT "punch_lists_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."punch_lists"
    ADD CONSTRAINT "punch_lists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rate_card_orders"
    ADD CONSTRAINT "rate_card_orders_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "public"."delegations"("id");



ALTER TABLE ONLY "public"."rate_limit_overrides"
    ADD CONSTRAINT "rate_limit_overrides_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."record_grants"
    ADD CONSTRAINT "record_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id");



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_xpms_atom_id_fkey" FOREIGN KEY ("xpms_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_asked_by_fkey" FOREIGN KEY ("asked_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_ball_in_court_id_fkey" FOREIGN KEY ("ball_in_court_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_linked_deliverable_id_fkey" FOREIGN KEY ("linked_deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_linked_po_id_fkey" FOREIGN KEY ("linked_po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_linked_site_plan_id_fkey" FOREIGN KEY ("linked_site_plan_id") REFERENCES "public"."site_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfis"
    ADD CONSTRAINT "rfis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_response_lines"
    ADD CONSTRAINT "rfq_response_lines_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_response_lines"
    ADD CONSTRAINT "rfq_response_lines_rfq_response_id_fkey" FOREIGN KEY ("rfq_response_id") REFERENCES "public"."rfq_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_responses"
    ADD CONSTRAINT "rfq_responses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_awarded_to_vendor_id_fkey" FOREIGN KEY ("awarded_to_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rosters"
    ADD CONSTRAINT "rosters_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."safety_briefing_attendees"
    ADD CONSTRAINT "safety_briefing_attendees_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "public"."safety_briefings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_briefing_attendees"
    ADD CONSTRAINT "safety_briefing_attendees_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."safety_briefing_attendees"
    ADD CONSTRAINT "safety_briefing_attendees_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_briefing_attendees"
    ADD CONSTRAINT "safety_briefing_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_briefer_id_fkey" FOREIGN KEY ("briefer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_briefings"
    ADD CONSTRAINT "safety_briefings_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_request_events"
    ADD CONSTRAINT "service_request_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_request_events"
    ADD CONSTRAINT "service_request_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_request_events"
    ADD CONSTRAINT "service_request_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."venue_zones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_sla_policies"
    ADD CONSTRAINT "service_sla_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."share_links"
    ADD CONSTRAINT "share_links_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_roster_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "public"."rosters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_workforce_member_id_fkey" FOREIGN KEY ("workforce_member_id") REFERENCES "public"."workforce_members"("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."venue_zones"("id");



ALTER TABLE ONLY "public"."site_plan_pins"
    ADD CONSTRAINT "site_plan_pins_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_plan_pins"
    ADD CONSTRAINT "site_plan_pins_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plan_pins"
    ADD CONSTRAINT "site_plan_pins_site_plan_id_fkey" FOREIGN KEY ("site_plan_id") REFERENCES "public"."site_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plan_revisions"
    ADD CONSTRAINT "site_plan_revisions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plan_revisions"
    ADD CONSTRAINT "site_plan_revisions_site_plan_id_fkey" FOREIGN KEY ("site_plan_id") REFERENCES "public"."site_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plan_revisions"
    ADD CONSTRAINT "site_plan_revisions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_current_revision_fk" FOREIGN KEY ("current_revision_id") REFERENCES "public"."site_plan_revisions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_plans"
    ADD CONSTRAINT "site_plans_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."slack_channel_mappings"
    ADD CONSTRAINT "slack_channel_mappings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_channel_mappings"
    ADD CONSTRAINT "slack_channel_mappings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."slack_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_user_links"
    ADD CONSTRAINT "slack_user_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_user_links"
    ADD CONSTRAINT "slack_user_links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."slack_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slack_workspaces"
    ADD CONSTRAINT "slack_workspaces_installed_by_fkey" FOREIGN KEY ("installed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."slack_workspaces"
    ADD CONSTRAINT "slack_workspaces_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_stamped_by_fkey" FOREIGN KEY ("stamped_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_submittal_id_fkey" FOREIGN KEY ("submittal_id") REFERENCES "public"."submittals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submittal_revisions"
    ADD CONSTRAINT "submittal_revisions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_ball_in_court_id_fkey" FOREIGN KEY ("ball_in_court_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submittals"
    ADD CONSTRAINT "submittals_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_xpms_atom_id_fkey" FOREIGN KEY ("xpms_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."threats"
    ADD CONSTRAINT "threats_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."threats"
    ADD CONSTRAINT "threats_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_scans"
    ADD CONSTRAINT "ticket_scans_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ticket_scans"
    ADD CONSTRAINT "ticket_scans_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_cost_code_id_fkey" FOREIGN KEY ("cost_code_id") REFERENCES "public"."cost_codes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_passkeys"
    ADD CONSTRAINT "user_passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_last_org_id_fkey" FOREIGN KEY ("last_org_id") REFERENCES "public"."orgs"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_prequalification_answers"
    ADD CONSTRAINT "vendor_prequalification_answers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_prequalification_answers"
    ADD CONSTRAINT "vendor_prequalification_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."prequalification_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_prequalification_answers"
    ADD CONSTRAINT "vendor_prequalification_answers_vendor_prequalification_id_fkey" FOREIGN KEY ("vendor_prequalification_id") REFERENCES "public"."vendor_prequalifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."prequalification_questionnaires"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."vendor_prequalifications"
    ADD CONSTRAINT "vendor_prequalifications_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_build_log"
    ADD CONSTRAINT "venue_build_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_build_log"
    ADD CONSTRAINT "venue_build_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_build_log"
    ADD CONSTRAINT "venue_build_log_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_certifications"
    ADD CONSTRAINT "venue_certifications_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_closeout_items"
    ADD CONSTRAINT "venue_closeout_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_closeout_items"
    ADD CONSTRAINT "venue_closeout_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_closeout_items"
    ADD CONSTRAINT "venue_closeout_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_closeout_items"
    ADD CONSTRAINT "venue_closeout_items_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_design_specs"
    ADD CONSTRAINT "venue_design_specs_bom_requisition_id_fkey" FOREIGN KEY ("bom_requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_design_specs"
    ADD CONSTRAINT "venue_design_specs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_design_specs"
    ADD CONSTRAINT "venue_design_specs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_design_specs"
    ADD CONSTRAINT "venue_design_specs_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_handover_items"
    ADD CONSTRAINT "venue_handover_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_handover_items"
    ADD CONSTRAINT "venue_handover_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_handover_items"
    ADD CONSTRAINT "venue_handover_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_handover_items"
    ADD CONSTRAINT "venue_handover_items_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_vop_sections"
    ADD CONSTRAINT "venue_vop_sections_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_vop_sections"
    ADD CONSTRAINT "venue_vop_sections_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_vop_sections"
    ADD CONSTRAINT "venue_vop_sections_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_zones"
    ADD CONSTRAINT "venue_zones_parent_zone_id_fkey" FOREIGN KEY ("parent_zone_id") REFERENCES "public"."venue_zones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venue_zones"
    ADD CONSTRAINT "venue_zones_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."view_configs"
    ADD CONSTRAINT "view_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."view_configs"
    ADD CONSTRAINT "view_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."view_configs"
    ADD CONSTRAINT "view_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."visa_cases"
    ADD CONSTRAINT "visa_cases_delegation_id_fkey" FOREIGN KEY ("delegation_id") REFERENCES "public"."delegations"("id");



ALTER TABLE ONLY "public"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_endpoints"
    ADD CONSTRAINT "webhook_endpoints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."webhook_endpoints"
    ADD CONSTRAINT "webhook_endpoints_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcast_invites"
    ADD CONSTRAINT "work_order_broadcast_invites_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "public"."work_order_broadcasts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcast_invites"
    ADD CONSTRAINT "work_order_broadcast_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcast_invites"
    ADD CONSTRAINT "work_order_broadcast_invites_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_awarded_to_vendor_id_fkey" FOREIGN KEY ("awarded_to_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_order_broadcasts"
    ADD CONSTRAINT "work_order_broadcasts_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workforce_deployments"
    ADD CONSTRAINT "workforce_deployments_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."workforce_deployments"
    ADD CONSTRAINT "workforce_deployments_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."venue_zones"("id");



ALTER TABLE ONLY "public"."workforce_members"
    ADD CONSTRAINT "workforce_members_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id");



ALTER TABLE ONLY "public"."xpms_atom_tiers"
    ADD CONSTRAINT "xpms_atom_tiers_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_class_code_fkey" FOREIGN KEY ("class_code") REFERENCES "public"."xtc_classes"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_division_code_fkey" FOREIGN KEY ("division_code") REFERENCES "public"."xtc_divisions"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_lineage_root_id_fkey" FOREIGN KEY ("lineage_root_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_section_code_fkey" FOREIGN KEY ("section_code") REFERENCES "public"."xtc_sections"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_uac_origin_id_fkey" FOREIGN KEY ("uac_origin_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."xpms_atoms"
    ADD CONSTRAINT "xpms_atoms_xtc_code_fkey" FOREIGN KEY ("xtc_code") REFERENCES "public"."xtc_codes"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_project_composition"
    ADD CONSTRAINT "xpms_project_composition_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_from_atom_id_fkey" FOREIGN KEY ("from_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_provenance_edges"
    ADD CONSTRAINT "xpms_provenance_edges_to_atom_id_fkey" FOREIGN KEY ("to_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_variance_ledger"
    ADD CONSTRAINT "xpms_variance_ledger_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_variance_ledger"
    ADD CONSTRAINT "xpms_variance_ledger_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xpms_variance_ledger"
    ADD CONSTRAINT "xpms_variance_ledger_tpc_atom_id_fkey" FOREIGN KEY ("tpc_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xpms_variance_ledger"
    ADD CONSTRAINT "xpms_variance_ledger_uac_atom_id_fkey" FOREIGN KEY ("uac_atom_id") REFERENCES "public"."xpms_atoms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xtc_codes"
    ADD CONSTRAINT "xtc_codes_section_code_fkey" FOREIGN KEY ("section_code") REFERENCES "public"."xtc_sections"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xtc_divisions"
    ADD CONSTRAINT "xtc_divisions_class_code_fkey" FOREIGN KEY ("class_code") REFERENCES "public"."xtc_classes"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."xtc_sections"
    ADD CONSTRAINT "xtc_sections_division_code_fkey" FOREIGN KEY ("division_code") REFERENCES "public"."xtc_divisions"("code") ON DELETE RESTRICT;



ALTER TABLE "public"."access_scans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "access_scans_insert" ON "public"."access_scans" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "access_scans_select" ON "public"."access_scans" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."accommodation_blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accommodation_blocks_rw" ON "public"."accommodation_blocks" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."accreditation_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accreditation_categories_rw__delete" ON "public"."accreditation_categories" FOR DELETE TO "authenticated" USING ("private"."is_org_member"("org_id"));



CREATE POLICY "accreditation_categories_rw__insert" ON "public"."accreditation_categories" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditation_categories_rw__update" ON "public"."accreditation_categories" FOR UPDATE TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditation_categories_select_consolidated" ON "public"."accreditation_categories" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."accreditation_changes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accreditation_changes_select_consolidated" ON "public"."accreditation_changes" FOR SELECT TO "authenticated" USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])));



CREATE POLICY "accreditation_changes_write__delete" ON "public"."accreditation_changes" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditation_changes_write__insert" ON "public"."accreditation_changes" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditation_changes_write__update" ON "public"."accreditation_changes" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."accreditations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accreditations_admin__delete" ON "public"."accreditations" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditations_admin__insert" ON "public"."accreditations" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditations_admin__update" ON "public"."accreditations" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "accreditations_select_consolidated" ON "public"."accreditations" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."ad_manifests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ad_manifests_rw" ON "public"."ad_manifests" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_agents_admin_write" ON "public"."ai_agents" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "ai_agents_select" ON "public"."ai_agents" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_conversations_delete" ON "public"."ai_conversations" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "ai_conversations_insert" ON "public"."ai_conversations" FOR INSERT WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND "private"."is_org_member"("org_id")));



CREATE POLICY "ai_conversations_select" ON "public"."ai_conversations" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])));



CREATE POLICY "ai_conversations_update" ON "public"."ai_conversations" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages_insert" ON "public"."ai_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "ai_messages_select" ON "public"."ai_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND (("c"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."has_org_role"("c"."org_id", ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."annotation_watchers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "annotation_watchers_delete" ON "public"."annotation_watchers" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."annotations" "a"
  WHERE (("a"."id" = "annotation_watchers"."annotation_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "annotation_watchers_insert" ON "public"."annotation_watchers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."annotations" "a"
  WHERE (("a"."id" = "annotation_watchers"."annotation_id") AND "private"."is_org_member"("a"."org_id")))));



CREATE POLICY "annotation_watchers_select" ON "public"."annotation_watchers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."annotations" "a"
  WHERE (("a"."id" = "annotation_watchers"."annotation_id") AND "private"."is_org_member"("a"."org_id")))));



ALTER TABLE "public"."annotations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "annotations_insert" ON "public"."annotations" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "annotations_select" ON "public"."annotations" FOR SELECT TO "authenticated" USING (("private"."is_org_member"("org_id") AND ("deleted_at" IS NULL)));



CREATE POLICY "annotations_update" ON "public"."annotations" FOR UPDATE TO "authenticated" USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_keys_org_delete" ON "public"."api_keys" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "api_keys_org_insert" ON "public"."api_keys" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "api_keys_org_select" ON "public"."api_keys" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "api_keys_org_update" ON "public"."api_keys" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."asset_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "asset_links_org_modify__delete" ON "public"."asset_links" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "asset_links_org_modify__insert" ON "public"."asset_links" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "asset_links_org_modify__update" ON "public"."asset_links" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "asset_links_select_consolidated" ON "public"."asset_links" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_insert" ON "public"."audit_log" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "audit_log_select" ON "public"."audit_log" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."automation_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_runs_select" ON "public"."automation_runs" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."automation_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_schedules_service_only" ON "public"."automation_schedules" TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."automation_step_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_step_runs_select" ON "public"."automation_step_runs" FOR SELECT USING (("run_id" IN ( SELECT "automation_runs"."id"
   FROM "public"."automation_runs"
  WHERE "private"."is_org_member"("automation_runs"."org_id"))));



ALTER TABLE "public"."automation_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automations_org_modify__delete" ON "public"."automations" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "automations_org_modify__insert" ON "public"."automations" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "automations_org_modify__update" ON "public"."automations" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "automations_select_consolidated" ON "public"."automations" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR "private"."is_org_member"("org_id")));



CREATE POLICY "briefing_att_write__delete" ON "public"."safety_briefing_attendees" FOR DELETE USING ("private"."is_org_member"("org_id"));



CREATE POLICY "briefing_att_write__insert" ON "public"."safety_briefing_attendees" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "briefing_att_write__update" ON "public"."safety_briefing_attendees" FOR UPDATE USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "briefings_delete" ON "public"."safety_briefings" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "briefings_insert" ON "public"."safety_briefings" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "briefings_select" ON "public"."safety_briefings" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "briefings_update" ON "public"."safety_briefings" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "budgets_delete" ON "public"."budgets" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "budgets_insert" ON "public"."budgets" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "budgets_select" ON "public"."budgets" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "budgets_update" ON "public"."budgets" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_delete" ON "public"."campaigns" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "campaigns_insert" ON "public"."campaigns" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "campaigns_select" ON "public"."campaigns" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "campaigns_update" ON "public"."campaigns" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."case_studies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "case_studies_admin__delete" ON "public"."case_studies" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "case_studies_admin__insert" ON "public"."case_studies" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "case_studies_admin__update" ON "public"."case_studies" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "case_studies_select_consolidated" ON "public"."case_studies" FOR SELECT TO "authenticated", "anon" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("published_at" IS NOT NULL)));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete" ON "public"."clients" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "clients_insert" ON "public"."clients" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "clients_update" ON "public"."clients" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "committees_org_modify__delete" ON "public"."governance_committees" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "committees_org_modify__insert" ON "public"."governance_committees" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "committees_org_modify__update" ON "public"."governance_committees" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."consent_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consent_records_rw" ON "public"."consent_records" TO "authenticated" USING (("private"."is_org_member"("org_id") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("private"."is_org_member"("org_id") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "conv_msg_delete" ON "public"."conversation_messages" FOR DELETE USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])));



CREATE POLICY "conv_msg_insert" ON "public"."conversation_messages" FOR INSERT WITH CHECK (("private"."is_org_member"("org_id") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "conv_msg_select" ON "public"."conversation_messages" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "conv_msg_update" ON "public"."conversation_messages" FOR UPDATE USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_delete" ON "public"."conversations" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "conversations_update" ON "public"."conversations" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."cost_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cost_codes_select_consolidated" ON "public"."cost_codes" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])));



CREATE POLICY "cost_codes_write__delete" ON "public"."cost_codes" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "cost_codes_write__insert" ON "public"."cost_codes" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "cost_codes_write__update" ON "public"."cost_codes" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."credentials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "credentials_delete" ON "public"."credentials" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "credentials_insert" ON "public"."credentials" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "credentials_select" ON "public"."credentials" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "credentials_update" ON "public"."credentials" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."crew_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crew_members_delete" ON "public"."crew_members" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "crew_members_insert" ON "public"."crew_members" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "crew_members_select" ON "public"."crew_members" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "crew_members_update" ON "public"."crew_members" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."crisis_alert_receipts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crisis_alert_receipts_select" ON "public"."crisis_alert_receipts" FOR SELECT TO "authenticated" USING (("private"."is_org_member"("org_id") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "crisis_alert_receipts_update" ON "public"."crisis_alert_receipts" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."crisis_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crisis_alerts_admin__delete" ON "public"."crisis_alerts" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "crisis_alerts_admin__insert" ON "public"."crisis_alerts" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "crisis_alerts_admin__update" ON "public"."crisis_alerts" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "crisis_alerts_select_consolidated" ON "public"."crisis_alerts" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."cues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cues_org_modify__delete" ON "public"."cues" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "cues_org_modify__insert" ON "public"."cues" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "cues_org_modify__update" ON "public"."cues" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "cues_select_consolidated" ON "public"."cues" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."daily_log_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_log_deliveries_select_consolidated" ON "public"."daily_log_deliveries" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."daily_log_equipment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_log_equipment_select_consolidated" ON "public"."daily_log_equipment" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."daily_log_manpower" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_log_manpower_select_consolidated" ON "public"."daily_log_manpower" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."daily_log_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_log_photos_select_consolidated" ON "public"."daily_log_photos" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."daily_log_visitors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_log_visitors_select_consolidated" ON "public"."daily_log_visitors" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."daily_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_logs_delete" ON "public"."daily_logs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "daily_logs_insert" ON "public"."daily_logs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "daily_logs_select" ON "public"."daily_logs" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "daily_logs_update" ON "public"."daily_logs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."dashboards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboards_delete_own" ON "public"."dashboards" FOR DELETE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



CREATE POLICY "dashboards_insert" ON "public"."dashboards" FOR INSERT WITH CHECK (("private"."is_org_member"("org_id") AND (("scope" = 'private'::"public"."view_scope") OR (("scope" = ANY (ARRAY['org'::"public"."view_scope", 'public'::"public"."view_scope"])) AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))));



CREATE POLICY "dashboards_select" ON "public"."dashboards" FOR SELECT USING (("private"."is_org_member"("org_id") AND (("scope" = 'org'::"public"."view_scope") OR (("scope" = 'private'::"public"."view_scope") AND ("created_by" = "auth"."uid"())) OR ("scope" = 'public'::"public"."view_scope"))));



CREATE POLICY "dashboards_update_own" ON "public"."dashboards" FOR UPDATE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."delegation_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delegation_entries_rw" ON "public"."delegation_entries" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."delegations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delegations_admin__delete" ON "public"."delegations" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "delegations_admin__insert" ON "public"."delegations" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "delegations_admin__update" ON "public"."delegations" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "delegations_select_consolidated" ON "public"."delegations" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("attache_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."deliverable_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deliverable_comments_insert" ON "public"."deliverable_comments" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."deliverables" "d"
  WHERE (("d"."id" = "deliverable_comments"."deliverable_id") AND ("private"."is_org_member"("d"."org_id") OR ("d"."submitted_by" = ( SELECT "auth"."uid"() AS "uid")))))) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "deliverable_comments_select" ON "public"."deliverable_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."deliverables" "d"
  WHERE (("d"."id" = "deliverable_comments"."deliverable_id") AND ("private"."is_org_member"("d"."org_id") OR ("d"."submitted_by" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."deliverable_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deliverable_history_select" ON "public"."deliverable_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."deliverables" "d"
  WHERE (("d"."id" = "deliverable_history"."deliverable_id") AND "private"."is_org_member"("d"."org_id")))));



ALTER TABLE "public"."deliverable_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deliverable_templates_delete" ON "public"."deliverable_templates" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "deliverable_templates_insert" ON "public"."deliverable_templates" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "deliverable_templates_select" ON "public"."deliverable_templates" FOR SELECT TO "authenticated" USING (("private"."is_org_member"("org_id") OR ("is_global" = true)));



CREATE POLICY "deliverable_templates_update" ON "public"."deliverable_templates" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."deliverables" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deliverables_insert" ON "public"."deliverables" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "deliverables_select" ON "public"."deliverables" FOR SELECT USING (("private"."is_org_member"("org_id") OR ("submitted_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "deliverables_update_consolidated" ON "public"."deliverables" FOR UPDATE USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("submitted_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = ANY (ARRAY['draft'::"public"."deliverable_status", 'revision_requested'::"public"."deliverable_status"]))))) WITH CHECK (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR ("submitted_by" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."dispatch_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dispatch_runs_admin__delete" ON "public"."dispatch_runs" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "dispatch_runs_admin__insert" ON "public"."dispatch_runs" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "dispatch_runs_admin__update" ON "public"."dispatch_runs" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "dispatch_runs_select_consolidated" ON "public"."dispatch_runs" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("driver_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "dl_deliveries_write__delete" ON "public"."daily_log_deliveries" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_deliveries_write__insert" ON "public"."daily_log_deliveries" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_deliveries_write__update" ON "public"."daily_log_deliveries" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_equipment_write__delete" ON "public"."daily_log_equipment" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_equipment_write__insert" ON "public"."daily_log_equipment" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_equipment_write__update" ON "public"."daily_log_equipment" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_manpower_write__delete" ON "public"."daily_log_manpower" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_manpower_write__insert" ON "public"."daily_log_manpower" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_manpower_write__update" ON "public"."daily_log_manpower" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_photos_write__delete" ON "public"."daily_log_photos" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_photos_write__insert" ON "public"."daily_log_photos" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_photos_write__update" ON "public"."daily_log_photos" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_visitors_write__delete" ON "public"."daily_log_visitors" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_visitors_write__insert" ON "public"."daily_log_visitors" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "dl_visitors_write__update" ON "public"."daily_log_visitors" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."domain_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "domain_events_select" ON "public"."domain_events" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."dsar_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dsar_requests_admin__delete" ON "public"."dsar_requests" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "dsar_requests_admin__update" ON "public"."dsar_requests" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "dsar_requests_insert_consolidated" ON "public"."dsar_requests" FOR INSERT TO "authenticated" WITH CHECK (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("requester_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("lower"("requester_email") = "lower"(COALESCE((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text"), ''::"text"))))));



CREATE POLICY "dsar_requests_select_consolidated" ON "public"."dsar_requests" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("requester_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_templates_delete" ON "public"."email_templates" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "email_templates_insert" ON "public"."email_templates" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "email_templates_select" ON "public"."email_templates" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



CREATE POLICY "email_templates_update" ON "public"."email_templates" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."environmental_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "environmental_events_rw" ON "public"."environmental_events" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "equipment_delete" ON "public"."equipment" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "equipment_insert" ON "public"."equipment" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "equipment_select" ON "public"."equipment" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "equipment_update" ON "public"."equipment" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."event_guides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_guides_delete" ON "public"."event_guides" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "event_guides_insert" ON "public"."event_guides" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "event_guides_select_consolidated" ON "public"."event_guides" FOR SELECT USING (("private"."is_org_member"("org_id") OR (("published" = true) AND (EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."project_id" = "event_guides"."project_id") AND ("t"."holder_email" = "private"."auth_user_email"()))))) OR ("published" = true)));



CREATE POLICY "event_guides_update" ON "public"."event_guides" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_delete" ON "public"."events" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "events_insert" ON "public"."events" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "events_select" ON "public"."events" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "events_update" ON "public"."events" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "evtlog_admin" ON "public"."org_event_log_destinations" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_delete" ON "public"."expenses" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "expenses_insert" ON "public"."expenses" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "expenses_select" ON "public"."expenses" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "expenses_update" ON "public"."expenses" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."export_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "export_runs_insert" ON "public"."export_runs" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "export_runs_no_client_update" ON "public"."export_runs" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "export_runs_select" ON "public"."export_runs" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."fabrication_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fabrication_orders_delete" ON "public"."fabrication_orders" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "fabrication_orders_insert" ON "public"."fabrication_orders" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "fabrication_orders_select" ON "public"."fabrication_orders" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "fabrication_orders_update" ON "public"."fabrication_orders" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."form_defs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_defs_org_modify__delete" ON "public"."form_defs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "form_defs_org_modify__insert" ON "public"."form_defs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "form_defs_org_modify__update" ON "public"."form_defs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "form_defs_select_consolidated" ON "public"."form_defs" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_submissions_insert_public" ON "public"."form_submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("form_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."form_defs" "f"
  WHERE (("f"."id" = "form_submissions"."form_id") AND ("f"."status" = 'published'::"text"))))));



CREATE POLICY "form_submissions_select" ON "public"."form_submissions" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."governance_committees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "governance_committees_select_consolidated" ON "public"."governance_committees" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."governance_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "governance_policies_select_consolidated" ON "public"."governance_policies" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."guard_tours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "guard_tours_delete" ON "public"."guard_tours" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "guard_tours_insert" ON "public"."guard_tours" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "guard_tours_select" ON "public"."guard_tours" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "guard_tours_update" ON "public"."guard_tours" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."guide_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "guide_comments_admin" ON "public"."guide_comments" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "guide_comments_delete" ON "public"."guide_comments" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "guide_comments_insert_public" ON "public"."guide_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."event_guides" "g"
  WHERE (("g"."id" = "guide_comments"."guide_id") AND ("g"."published" = true) AND ("g"."org_id" = "guide_comments"."org_id")))));



CREATE POLICY "guide_comments_select_consolidated" ON "public"."guide_comments" FOR SELECT USING (("private"."is_org_member"("org_id") OR (EXISTS ( SELECT 1
   FROM "public"."event_guides" "g"
  WHERE (("g"."id" = "guide_comments"."guide_id") AND ("g"."published" = true))))));



ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idempotency_keys_no_client" ON "public"."idempotency_keys" FOR SELECT USING (false);



CREATE POLICY "imp_insert" ON "public"."import_jobs" FOR INSERT WITH CHECK (("private"."is_org_member"("org_id") AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])));



CREATE POLICY "imp_select" ON "public"."import_jobs" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "imp_update_owner" ON "public"."import_jobs" FOR UPDATE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."import_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "import_runs_org_modify__delete" ON "public"."import_runs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "import_runs_org_modify__insert" ON "public"."import_runs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "import_runs_org_modify__update" ON "public"."import_runs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "import_runs_select_consolidated" ON "public"."import_runs" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "incidents_insert" ON "public"."incidents" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "incidents_select" ON "public"."incidents" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



CREATE POLICY "incidents_update" ON "public"."incidents" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "insp_items_write__delete" ON "public"."inspection_items" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "insp_items_write__insert" ON "public"."inspection_items" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "insp_items_write__update" ON "public"."inspection_items" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "insp_tpl_delete" ON "public"."inspection_templates" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "insp_tpl_insert" ON "public"."inspection_templates" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "insp_tpl_items_write__delete" ON "public"."inspection_template_items" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "insp_tpl_items_write__insert" ON "public"."inspection_template_items" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "insp_tpl_items_write__update" ON "public"."inspection_template_items" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "insp_tpl_select" ON "public"."inspection_templates" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "insp_tpl_update" ON "public"."inspection_templates" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."inspection_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_items_select_consolidated" ON "public"."inspection_items" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



ALTER TABLE "public"."inspection_template_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_template_items_select_consolidated" ON "public"."inspection_template_items" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



ALTER TABLE "public"."inspection_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspections_delete" ON "public"."inspections" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "inspections_insert" ON "public"."inspections" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "inspections_select" ON "public"."inspections" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "inspections_update" ON "public"."inspections" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."insurance_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insurance_policies_rw" ON "public"."insurance_policies" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."integration_connectors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integration_connectors_admin__delete" ON "public"."integration_connectors" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "integration_connectors_admin__insert" ON "public"."integration_connectors" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "integration_connectors_admin__update" ON "public"."integration_connectors" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "integration_connectors_select_consolidated" ON "public"."integration_connectors" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites_delete_admin" ON "public"."invites" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'developer'::"text"]));



CREATE POLICY "invites_insert_admin" ON "public"."invites" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'developer'::"text"]));



CREATE POLICY "invites_select_consolidated" ON "public"."invites" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'developer'::"text"]) OR (("status" = 'pending'::"text") AND ("expires_at" > "now"()) AND ("lower"("email") = "lower"(( SELECT "auth"."email"() AS "email"))))));



CREATE POLICY "invites_update_consolidated" ON "public"."invites" FOR UPDATE USING (((("status" = 'pending'::"text") AND ("expires_at" > "now"()) AND ("lower"("email") = "lower"(( SELECT "auth"."email"() AS "email")))) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'developer'::"text"]))) WITH CHECK (((("status" = 'accepted'::"text") AND ("accepted_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("lower"("email") = "lower"(( SELECT "auth"."email"() AS "email")))) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'developer'::"text"])));



ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoice_line_items_modify__delete" ON "public"."invoice_line_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."has_org_role"("i"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "invoice_line_items_modify__insert" ON "public"."invoice_line_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."has_org_role"("i"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "invoice_line_items_modify__update" ON "public"."invoice_line_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."has_org_role"("i"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."has_org_role"("i"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "invoice_line_items_select_consolidated" ON "public"."invoice_line_items" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."has_org_role"("i"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))) OR (EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND "private"."is_org_member"("i"."org_id"))))));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_delete" ON "public"."invoices" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "invoices_insert" ON "public"."invoices" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "invoices_select" ON "public"."invoices" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "invoices_update" ON "public"."invoices" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "ip_admin" ON "public"."org_ip_allowlist" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."itil_changes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "itil_changes_delete" ON "public"."itil_changes" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "itil_changes_insert" ON "public"."itil_changes" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "itil_changes_select" ON "public"."itil_changes" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "itil_changes_update" ON "public"."itil_changes" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."itil_problems" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "itil_problems_delete" ON "public"."itil_problems" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "itil_problems_insert" ON "public"."itil_problems" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "itil_problems_select" ON "public"."itil_problems" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "itil_problems_update" ON "public"."itil_problems" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."job_queue" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_queue_no_client_delete" ON "public"."job_queue" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "job_queue_no_client_update" ON "public"."job_queue" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "job_queue_no_client_write" ON "public"."job_queue" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "job_queue_select" ON "public"."job_queue" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."kb_articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kb_articles_select_consolidated" ON "public"."kb_articles" FOR SELECT TO "authenticated" USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



CREATE POLICY "kb_articles_write__delete" ON "public"."kb_articles" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "kb_articles_write__insert" ON "public"."kb_articles" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "kb_articles_write__update" ON "public"."kb_articles" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_delete" ON "public"."leads" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "leads_insert" ON "public"."leads" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "leads_select" ON "public"."leads" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "leads_update" ON "public"."leads" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_delete" ON "public"."locations" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "locations_insert" ON "public"."locations" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "locations_select" ON "public"."locations" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "locations_update" ON "public"."locations" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "maint_jobs_delete" ON "public"."maintenance_jobs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "maint_jobs_insert" ON "public"."maintenance_jobs" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "maint_jobs_select" ON "public"."maintenance_jobs" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "maint_jobs_update" ON "public"."maintenance_jobs" FOR UPDATE USING ("private"."is_org_member"("org_id"));



CREATE POLICY "maint_sched_delete" ON "public"."maintenance_schedules" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "maint_sched_insert" ON "public"."maintenance_schedules" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "maint_sched_select" ON "public"."maintenance_schedules" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "maint_sched_update" ON "public"."maintenance_schedules" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."maintenance_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."major_incidents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "major_incidents_rw" ON "public"."major_incidents" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."medical_encounters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medical_encounters_select_consolidated" ON "public"."medical_encounters" FOR SELECT TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "medical_encounters_write__delete" ON "public"."medical_encounters" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "medical_encounters_write__insert" ON "public"."medical_encounters" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "medical_encounters_write__update" ON "public"."medical_encounters" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memberships_delete_admin" ON "public"."memberships" FOR DELETE USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "memberships_insert_admin" ON "public"."memberships" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "memberships_select" ON "public"."memberships" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "private"."is_org_member"("org_id")));



CREATE POLICY "memberships_update_admin" ON "public"."memberships" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."mfa_recovery_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mfa_recovery_codes_service_only" ON "public"."mfa_recovery_codes" TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."mileage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mileage_logs_delete" ON "public"."mileage_logs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "mileage_logs_insert" ON "public"."mileage_logs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "mileage_logs_select" ON "public"."mileage_logs" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "mileage_logs_update" ON "public"."mileage_logs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."offer_letter_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offer_letter_activity_member" ON "public"."offer_letter_activity" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."offer_letters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offer_letters_member" ON "public"."offer_letters" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."org_domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_domains_org_delete" ON "public"."org_domains" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_domains_org_insert" ON "public"."org_domains" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_domains_org_select" ON "public"."org_domains" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "org_domains_org_update" ON "public"."org_domains" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."org_event_log_destinations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_integrations_org_modify__delete" ON "public"."org_integrations" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_integrations_org_modify__insert" ON "public"."org_integrations" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_integrations_org_modify__update" ON "public"."org_integrations" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_integrations_select_consolidated" ON "public"."org_integrations" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."org_ip_allowlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_offer_letter_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_offer_letter_settings_member" ON "public"."org_offer_letter_settings" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."org_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_roles_org_modify__delete" ON "public"."org_roles" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_roles_org_modify__insert" ON "public"."org_roles" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_roles_org_modify__update" ON "public"."org_roles" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "org_roles_select_consolidated" ON "public"."org_roles" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."org_scim_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_sequences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_sequences_admin_write" ON "public"."org_sequences" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]));



CREATE POLICY "org_sequences_select" ON "public"."org_sequences" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."org_sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orgs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgs_select" ON "public"."orgs" FOR SELECT USING ("private"."is_org_member"("id"));



CREATE POLICY "orgs_update" ON "public"."orgs" FOR UPDATE USING ("private"."has_org_role"("id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "pay_app_lines_write__delete" ON "public"."payment_application_lines" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "pay_app_lines_write__insert" ON "public"."payment_application_lines" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "pay_app_lines_write__update" ON "public"."payment_application_lines" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "pay_apps_delete" ON "public"."payment_applications" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "pay_apps_insert" ON "public"."payment_applications" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "pay_apps_select" ON "public"."payment_applications" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "pay_apps_update" ON "public"."payment_applications" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."payment_application_lines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_application_lines_select_consolidated" ON "public"."payment_application_lines" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."payment_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playbooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "playbooks_delete" ON "public"."playbooks" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "playbooks_insert" ON "public"."playbooks" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "playbooks_select" ON "public"."playbooks" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "playbooks_update" ON "public"."playbooks" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."po_change_order_lines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "po_change_order_lines_select_consolidated" ON "public"."po_change_order_lines" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."po_change_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."po_checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "po_checklist_items_select_consolidated" ON "public"."po_checklist_items" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "po_chk_write__delete" ON "public"."po_checklist_items" FOR DELETE USING ("private"."is_org_member"("org_id"));



CREATE POLICY "po_chk_write__insert" ON "public"."po_checklist_items" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "po_chk_write__update" ON "public"."po_checklist_items" FOR UPDATE USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "po_co_delete" ON "public"."po_change_orders" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "po_co_insert" ON "public"."po_change_orders" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "po_co_lines_write__delete" ON "public"."po_change_order_lines" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "po_co_lines_write__insert" ON "public"."po_change_order_lines" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "po_co_lines_write__update" ON "public"."po_change_order_lines" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "po_co_select" ON "public"."po_change_orders" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "po_co_update" ON "public"."po_change_orders" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."po_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "po_line_items_modify__delete" ON "public"."po_line_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "po_line_items_modify__insert" ON "public"."po_line_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "po_line_items_modify__update" ON "public"."po_line_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "po_line_items_select_consolidated" ON "public"."po_line_items" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))) OR (EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "p"
  WHERE (("p"."id" = "po_line_items"."purchase_order_id") AND "private"."is_org_member"("p"."org_id"))))));



CREATE POLICY "policies_org_modify__delete" ON "public"."governance_policies" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "policies_org_modify__insert" ON "public"."governance_policies" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "policies_org_modify__update" ON "public"."governance_policies" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "prequal_q_write__delete" ON "public"."prequalification_questionnaires" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "prequal_q_write__insert" ON "public"."prequalification_questionnaires" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "prequal_q_write__update" ON "public"."prequalification_questionnaires" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "prequal_questions_write__delete" ON "public"."prequalification_questions" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "prequal_questions_write__insert" ON "public"."prequalification_questions" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "prequal_questions_write__update" ON "public"."prequalification_questions" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."prequalification_questionnaires" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prequalification_questionnaires_select_consolidated" ON "public"."prequalification_questionnaires" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])));



ALTER TABLE "public"."prequalification_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prequalification_questions_select_consolidated" ON "public"."prequalification_questions" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])));



ALTER TABLE "public"."program_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_reviews_rw" ON "public"."program_reviews" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "proj_photos_write__delete" ON "public"."project_photos" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"]));



CREATE POLICY "proj_photos_write__insert" ON "public"."project_photos" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"]));



CREATE POLICY "proj_photos_write__update" ON "public"."project_photos" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_members_delete" ON "public"."project_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_members"."project_id") AND "private"."is_org_manager_plus"("p"."org_id"))))));



CREATE POLICY "project_members_insert" ON "public"."project_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_members"."project_id") AND "private"."is_org_manager_plus"("p"."org_id")))));



CREATE POLICY "project_members_select" ON "public"."project_members" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_members"."project_id") AND "private"."is_org_member"("p"."org_id"))))));



CREATE POLICY "project_members_update" ON "public"."project_members" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_members"."project_id") AND "private"."is_org_manager_plus"("p"."org_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_members"."project_id") AND "private"."is_org_manager_plus"("p"."org_id")))));



ALTER TABLE "public"."project_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_photos_select_consolidated" ON "public"."project_photos" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."project_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_delete" ON "public"."projects" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "projects_insert" ON "public"."projects" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "projects_select_consolidated" ON "public"."projects" FOR SELECT USING (("private"."is_org_member"("org_id") OR (EXISTS ( SELECT 1
   FROM "public"."event_guides" "g"
  WHERE (("g"."project_id" = "projects"."id") AND ("g"."published" = true))))));



CREATE POLICY "projects_update" ON "public"."projects" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."proposal_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_activity_member" ON "public"."proposal_activity" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_approvals_member" ON "public"."proposal_approvals" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_change_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_change_orders_member" ON "public"."proposal_change_orders" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_events_insert" ON "public"."proposal_events" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposal_share_links" "l"
  WHERE (("l"."proposal_id" = "proposal_events"."proposal_id") AND ("l"."revoked_at" IS NULL) AND (("l"."expires_at" IS NULL) OR ("l"."expires_at" > "now"()))))));



CREATE POLICY "proposal_events_select" ON "public"."proposal_events" FOR SELECT USING ("private"."is_org_member"("private"."proposal_org_id"("proposal_id")));



ALTER TABLE "public"."proposal_files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_files_member" ON "public"."proposal_files" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_gate_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_gate_items_member" ON "public"."proposal_gate_items" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_phase_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_phase_states_member" ON "public"."proposal_phase_states" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_revision_rounds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_revision_rounds_member" ON "public"."proposal_revision_rounds" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_revisions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_revisions_member" ON "public"."proposal_revisions" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."proposal_share_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_share_links_modify__delete" ON "public"."proposal_share_links" FOR DELETE USING ("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "proposal_share_links_modify__insert" ON "public"."proposal_share_links" FOR INSERT WITH CHECK ("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "proposal_share_links_select_consolidated" ON "public"."proposal_share_links" FOR SELECT USING (("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))) OR "private"."is_org_member"("private"."proposal_org_id"("proposal_id"))));



CREATE POLICY "proposal_share_links_update_consolidated" ON "public"."proposal_share_links" FOR UPDATE USING (("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))))) WITH CHECK (("private"."has_org_role"("private"."proposal_org_id"("proposal_id"), ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR (("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"())))));



ALTER TABLE "public"."proposal_signatures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_signatures_insert" ON "public"."proposal_signatures" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposal_share_links" "l"
  WHERE (("l"."proposal_id" = "proposal_signatures"."proposal_id") AND ("l"."revoked_at" IS NULL) AND (("l"."expires_at" IS NULL) OR ("l"."expires_at" > "now"()))))));



CREATE POLICY "proposal_signatures_select" ON "public"."proposal_signatures" FOR SELECT USING ("private"."is_org_member"("private"."proposal_org_id"("proposal_id")));



ALTER TABLE "public"."proposal_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_versions_select" ON "public"."proposal_versions" FOR SELECT USING ("private"."is_org_member"("private"."proposal_org_id"("proposal_id")));



ALTER TABLE "public"."proposals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposals_delete" ON "public"."proposals" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "proposals_insert" ON "public"."proposals" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "proposals_select_consolidated" ON "public"."proposals" FOR SELECT USING (("private"."is_org_member"("org_id") OR (EXISTS ( SELECT 1
   FROM "public"."proposal_share_links" "s"
  WHERE (("s"."proposal_id" = "proposals"."id") AND ("s"."revoked_at" IS NULL) AND (("s"."expires_at" IS NULL) OR ("s"."expires_at" > "now"())))))));



CREATE POLICY "proposals_update" ON "public"."proposals" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."punch_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "punch_items_delete" ON "public"."punch_items" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "punch_items_insert" ON "public"."punch_items" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "punch_items_select" ON "public"."punch_items" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "punch_items_update" ON "public"."punch_items" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."punch_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "punch_lists_select_consolidated" ON "public"."punch_lists" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



CREATE POLICY "punch_lists_write__delete" ON "public"."punch_lists" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "punch_lists_write__insert" ON "public"."punch_lists" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "punch_lists_write__update" ON "public"."punch_lists" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchase_orders_delete" ON "public"."purchase_orders" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "purchase_orders_insert" ON "public"."purchase_orders" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "purchase_orders_select" ON "public"."purchase_orders" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "purchase_orders_update" ON "public"."purchase_orders" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "push_subs_self_delete" ON "public"."push_subscriptions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subs_self_insert" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subs_self_select" ON "public"."push_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subs_self_update" ON "public"."push_subscriptions" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_card_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_card_items_admin__delete" ON "public"."rate_card_items" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "rate_card_items_admin__insert" ON "public"."rate_card_items" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "rate_card_items_admin__update" ON "public"."rate_card_items" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "rate_card_items_select_consolidated" ON "public"."rate_card_items" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."rate_card_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_card_orders_rw" ON "public"."rate_card_orders" TO "authenticated" USING (("private"."is_org_member"("org_id") OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("private"."is_org_member"("org_id") OR ("requester_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."rate_limit_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_limit_overrides_select_consolidated" ON "public"."rate_limit_overrides" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])));



CREATE POLICY "rate_limit_overrides_write__delete" ON "public"."rate_limit_overrides" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "rate_limit_overrides_write__insert" ON "public"."rate_limit_overrides" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "rate_limit_overrides_write__update" ON "public"."rate_limit_overrides" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."readiness_exercises" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "readiness_exercises_rw" ON "public"."readiness_exercises" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."record_grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "record_grants_admin_write" ON "public"."record_grants" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]));



CREATE POLICY "record_grants_select" ON "public"."record_grants" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."rentals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rentals_delete" ON "public"."rentals" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "rentals_insert" ON "public"."rentals" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "rentals_select" ON "public"."rentals" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "rentals_update" ON "public"."rentals" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."requisitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requisitions_delete" ON "public"."requisitions" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "requisitions_insert" ON "public"."requisitions" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "requisitions_select" ON "public"."requisitions" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "requisitions_update" ON "public"."requisitions" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."rfis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rfis_delete" ON "public"."rfis" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "rfis_insert" ON "public"."rfis" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "rfis_select" ON "public"."rfis" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "rfis_update" ON "public"."rfis" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"]));



CREATE POLICY "rfq_resp_delete" ON "public"."rfq_responses" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "rfq_resp_insert" ON "public"."rfq_responses" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "rfq_resp_lines_write__delete" ON "public"."rfq_response_lines" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "rfq_resp_lines_write__insert" ON "public"."rfq_response_lines" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "rfq_resp_lines_write__update" ON "public"."rfq_response_lines" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "rfq_resp_select" ON "public"."rfq_responses" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "rfq_resp_update" ON "public"."rfq_responses" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."rfq_response_lines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rfq_response_lines_select_consolidated" ON "public"."rfq_response_lines" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."rfq_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rfqs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rfqs_org_modify__delete" ON "public"."rfqs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "rfqs_org_modify__insert" ON "public"."rfqs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "rfqs_org_modify__update" ON "public"."rfqs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "rfqs_select_consolidated" ON "public"."rfqs" FOR SELECT USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."risks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "risks_delete" ON "public"."risks" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "risks_insert" ON "public"."risks" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "risks_select" ON "public"."risks" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



CREATE POLICY "risks_update" ON "public"."risks" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."rosters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rosters_rw" ON "public"."rosters" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."safeguarding_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "safeguarding_reports_insert" ON "public"."safeguarding_reports" FOR INSERT TO "authenticated" WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "safeguarding_reports_select" ON "public"."safeguarding_reports" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]) OR ("reporter_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "safeguarding_reports_update" ON "public"."safeguarding_reports" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."safety_briefing_attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "safety_briefing_attendees_select_consolidated" ON "public"."safety_briefing_attendees" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."safety_briefings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scim_admin" ON "public"."org_scim_tokens" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."service_request_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_request_events_insert" ON "public"."service_request_events" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "service_request_events_select" ON "public"."service_request_events" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_requests_delete" ON "public"."service_requests" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "service_requests_insert" ON "public"."service_requests" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "service_requests_select" ON "public"."service_requests" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "service_requests_update" ON "public"."service_requests" FOR UPDATE USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."service_sla_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_sla_policies_delete" ON "public"."service_sla_policies" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "service_sla_policies_insert" ON "public"."service_sla_policies" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "service_sla_policies_select" ON "public"."service_sla_policies" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "service_sla_policies_update" ON "public"."service_sla_policies" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."share_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "share_links_insert" ON "public"."share_links" FOR INSERT WITH CHECK (("private"."is_org_member"("org_id") AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])));



CREATE POLICY "share_links_revoke" ON "public"."share_links" FOR UPDATE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



CREATE POLICY "share_links_select" ON "public"."share_links" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shifts_admin__delete" ON "public"."shifts" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "shifts_admin__insert" ON "public"."shifts" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "shifts_admin__update" ON "public"."shifts" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "shifts_select_consolidated" ON "public"."shifts" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]) OR ("private"."is_org_member"("org_id") OR (EXISTS ( SELECT 1
   FROM "public"."workforce_members" "wm"
  WHERE (("wm"."id" = "shifts"."workforce_member_id") AND ("wm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."site_plan_pins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_plan_pins_select_consolidated" ON "public"."site_plan_pins" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])));



CREATE POLICY "site_plan_pins_write__delete" ON "public"."site_plan_pins" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "site_plan_pins_write__insert" ON "public"."site_plan_pins" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "site_plan_pins_write__update" ON "public"."site_plan_pins" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "site_plan_rev_write__delete" ON "public"."site_plan_revisions" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "site_plan_rev_write__insert" ON "public"."site_plan_revisions" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "site_plan_rev_write__update" ON "public"."site_plan_revisions" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."site_plan_revisions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_plan_revisions_select_consolidated" ON "public"."site_plan_revisions" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



ALTER TABLE "public"."site_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_plans_delete" ON "public"."site_plans" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "site_plans_insert" ON "public"."site_plans" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "site_plans_select" ON "public"."site_plans" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "site_plans_update" ON "public"."site_plans" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "slack_admin" ON "public"."slack_workspaces" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "slack_chan_admin" ON "public"."slack_channel_mappings" USING (("workspace_id" IN ( SELECT "slack_workspaces"."id"
   FROM "public"."slack_workspaces"
  WHERE "private"."has_org_role"("slack_workspaces"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))) WITH CHECK (("workspace_id" IN ( SELECT "slack_workspaces"."id"
   FROM "public"."slack_workspaces"
  WHERE "private"."has_org_role"("slack_workspaces"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))));



ALTER TABLE "public"."slack_channel_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slack_user_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "slack_user_self" ON "public"."slack_user_links" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."slack_workspaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsor_entitlements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsor_entitlements_admin__delete" ON "public"."sponsor_entitlements" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "sponsor_entitlements_admin__insert" ON "public"."sponsor_entitlements" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "sponsor_entitlements_admin__update" ON "public"."sponsor_entitlements" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "sponsor_entitlements_select_consolidated" ON "public"."sponsor_entitlements" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR "private"."is_org_member"("org_id")));



CREATE POLICY "sso_admin" ON "public"."org_sso_providers" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



ALTER TABLE "public"."stage_plots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stage_plots_delete" ON "public"."stage_plots" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "stage_plots_insert" ON "public"."stage_plots" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "stage_plots_select" ON "public"."stage_plots" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



CREATE POLICY "stage_plots_update" ON "public"."stage_plots" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stripe_events_no_client" ON "public"."stripe_events" TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "submittal_rev_write__delete" ON "public"."submittal_revisions" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "submittal_rev_write__insert" ON "public"."submittal_revisions" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "submittal_rev_write__update" ON "public"."submittal_revisions" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."submittal_revisions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "submittal_revisions_select_consolidated" ON "public"."submittal_revisions" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."submittals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "submittals_delete" ON "public"."submittals" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "submittals_insert" ON "public"."submittals" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "submittals_select" ON "public"."submittals" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "submittals_update" ON "public"."submittals" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "subs_admin_write" ON "public"."automation_subscriptions" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]));



CREATE POLICY "subs_select" ON "public"."automation_subscriptions" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."sustainability_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sustainability_metrics_rw" ON "public"."sustainability_metrics" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete" ON "public"."tasks" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "tasks_insert" ON "public"."tasks" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "tasks_update" ON "public"."tasks" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_admin_write" ON "public"."team_members" USING ((("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE "private"."has_org_role"("teams"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))) OR (EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."team_id" = "team_members"."team_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'admin'::"text")))))) WITH CHECK ((("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE "private"."has_org_role"("teams"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))) OR (EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."team_id" = "team_members"."team_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'admin'::"text"))))));



CREATE POLICY "team_members_select" ON "public"."team_members" FOR SELECT USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE "private"."is_org_member"("teams"."org_id"))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_admin_write" ON "public"."teams" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]));



CREATE POLICY "teams_select" ON "public"."teams" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."threats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "threats_delete" ON "public"."threats" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "threats_insert" ON "public"."threats" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "threats_select" ON "public"."threats" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "threats_update" ON "public"."threats" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."ticket_scans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ticket_scans_insert" ON "public"."ticket_scans" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_scans"."ticket_id") AND "private"."has_org_role"("t"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text", 'contractor'::"text"])))));



CREATE POLICY "ticket_scans_select" ON "public"."ticket_scans" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_scans"."ticket_id") AND "private"."is_org_member"("t"."org_id")))));



ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ticket_types_admin__delete" ON "public"."ticket_types" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "ticket_types_admin__insert" ON "public"."ticket_types" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "ticket_types_admin__update" ON "public"."ticket_types" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "ticket_types_select_consolidated" ON "public"."ticket_types" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tickets_insert" ON "public"."tickets" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "tickets_select" ON "public"."tickets" FOR SELECT USING (("private"."is_org_member"("org_id") OR ("holder_email" = "private"."auth_user_email"())));



CREATE POLICY "tickets_update" ON "public"."tickets" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."time_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "time_entries_delete" ON "public"."time_entries" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "time_entries_insert" ON "public"."time_entries" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "time_entries_select" ON "public"."time_entries" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "time_entries_update" ON "public"."time_entries" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "tpl_admin_write" ON "public"."project_templates" USING ((("org_id" IS NOT NULL) AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))) WITH CHECK ((("org_id" IS NOT NULL) AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])));



CREATE POLICY "tpl_select" ON "public"."project_templates" FOR SELECT USING ((("org_id" IS NULL) OR "private"."is_org_member"("org_id")));



ALTER TABLE "public"."trademarks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trademarks_rw" ON "public"."trademarks" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



ALTER TABLE "public"."usage_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usage_events_no_client_write" ON "public"."usage_events" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "usage_events_select" ON "public"."usage_events" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."usage_rollups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usage_rollups_no_client_update" ON "public"."usage_rollups" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "usage_rollups_no_client_write" ON "public"."usage_rollups" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "usage_rollups_select" ON "public"."usage_rollups" FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."user_passkeys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_passkeys_own_rw" ON "public"."user_passkeys" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_own_rw" ON "public"."user_preferences" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_self" ON "public"."users" FOR SELECT USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."memberships" "m1"
     JOIN "public"."memberships" "m2" ON (("m1"."org_id" = "m2"."org_id")))
  WHERE (("m1"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m2"."user_id" = "users"."id"))))));



CREATE POLICY "users_update_self" ON "public"."users" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."vendor_prequalification_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendor_prequalification_answers_select_consolidated" ON "public"."vendor_prequalification_answers" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])));



ALTER TABLE "public"."vendor_prequalifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendors_delete" ON "public"."vendors" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "vendors_insert" ON "public"."vendors" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "vendors_select" ON "public"."vendors" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "vendors_update" ON "public"."vendors" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."venue_build_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_build_log_delete" ON "public"."venue_build_log" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "venue_build_log_insert" ON "public"."venue_build_log" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "venue_build_log_select" ON "public"."venue_build_log" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_build_log_update" ON "public"."venue_build_log" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."venue_certifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_certifications_rw" ON "public"."venue_certifications" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_closeout_delete" ON "public"."venue_closeout_items" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "venue_closeout_insert" ON "public"."venue_closeout_items" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."venue_closeout_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_closeout_select" ON "public"."venue_closeout_items" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_closeout_update" ON "public"."venue_closeout_items" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."venue_design_specs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_design_specs_delete" ON "public"."venue_design_specs" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "venue_design_specs_insert" ON "public"."venue_design_specs" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "venue_design_specs_select" ON "public"."venue_design_specs" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_design_specs_update" ON "public"."venue_design_specs" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "venue_handover_delete" ON "public"."venue_handover_items" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "venue_handover_insert" ON "public"."venue_handover_items" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



ALTER TABLE "public"."venue_handover_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_handover_select" ON "public"."venue_handover_items" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_handover_update" ON "public"."venue_handover_items" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'crew'::"text"]));



CREATE POLICY "venue_vop_delete" ON "public"."venue_vop_sections" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "venue_vop_insert" ON "public"."venue_vop_sections" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."venue_vop_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_vop_select" ON "public"."venue_vop_sections" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "venue_vop_update" ON "public"."venue_vop_sections" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."venue_zones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_zones_rw" ON "public"."venue_zones" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venues_rw" ON "public"."venues" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."view_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view_configs_delete_own" ON "public"."view_configs" FOR DELETE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



CREATE POLICY "view_configs_insert" ON "public"."view_configs" FOR INSERT WITH CHECK (("private"."is_org_member"("org_id") AND (("scope" = 'private'::"public"."view_scope") OR (("scope" = ANY (ARRAY['org'::"public"."view_scope", 'public'::"public"."view_scope"])) AND "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))));



CREATE POLICY "view_configs_select" ON "public"."view_configs" FOR SELECT USING (("private"."is_org_member"("org_id") AND (("scope" = 'org'::"public"."view_scope") OR (("scope" = 'private'::"public"."view_scope") AND ("created_by" = "auth"."uid"())) OR ("scope" = 'public'::"public"."view_scope"))));



CREATE POLICY "view_configs_update_own" ON "public"."view_configs" FOR UPDATE USING (("private"."is_org_member"("org_id") AND (("created_by" = "auth"."uid"()) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"])) AND (("is_locked" = false) OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."visa_cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visa_cases_rw" ON "public"."visa_cases" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "vp_ans_write__delete" ON "public"."vendor_prequalification_answers" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "vp_ans_write__insert" ON "public"."vendor_prequalification_answers" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "vp_ans_write__update" ON "public"."vendor_prequalification_answers" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



CREATE POLICY "vp_delete" ON "public"."vendor_prequalifications" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "vp_insert" ON "public"."vendor_prequalifications" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "vp_select" ON "public"."vendor_prequalifications" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "vp_update" ON "public"."vendor_prequalifications" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text", 'contractor'::"text"]));



ALTER TABLE "public"."webauthn_challenges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webauthn_challenges_no_client" ON "public"."webauthn_challenges" FOR SELECT USING (false);



ALTER TABLE "public"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webhook_deliveries_read" ON "public"."webhook_deliveries" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."webhook_endpoints" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webhook_endpoints_delete" ON "public"."webhook_endpoints" FOR DELETE USING ("private"."is_org_member"("org_id"));



CREATE POLICY "webhook_endpoints_insert" ON "public"."webhook_endpoints" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "webhook_endpoints_read" ON "public"."webhook_endpoints" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "webhook_endpoints_update" ON "public"."webhook_endpoints" FOR UPDATE USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "wob_delete" ON "public"."work_order_broadcasts" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "wob_insert" ON "public"."work_order_broadcasts" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "wob_inv_write__delete" ON "public"."work_order_broadcast_invites" FOR DELETE USING ("private"."is_org_member"("org_id"));



CREATE POLICY "wob_inv_write__insert" ON "public"."work_order_broadcast_invites" FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "wob_inv_write__update" ON "public"."work_order_broadcast_invites" FOR UPDATE USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



CREATE POLICY "wob_select" ON "public"."work_order_broadcasts" FOR SELECT USING ("private"."is_org_member"("org_id"));



CREATE POLICY "wob_update" ON "public"."work_order_broadcasts" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."work_order_broadcast_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_order_broadcast_invites_select_consolidated" ON "public"."work_order_broadcast_invites" FOR SELECT USING ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."work_order_broadcasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workforce_deployments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workforce_deployments_rw" ON "public"."workforce_deployments" TO "authenticated" USING ("private"."is_org_member"("org_id")) WITH CHECK ("private"."is_org_member"("org_id"));



ALTER TABLE "public"."workforce_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workforce_members_admin__delete" ON "public"."workforce_members" FOR DELETE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "workforce_members_admin__insert" ON "public"."workforce_members" FOR INSERT TO "authenticated" WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "workforce_members_admin__update" ON "public"."workforce_members" FOR UPDATE TO "authenticated" USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]));



CREATE POLICY "workforce_members_select_consolidated" ON "public"."workforce_members" FOR SELECT TO "authenticated" USING (("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]) OR ("private"."is_org_member"("org_id") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."xpms_atom_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xpms_atom_tiers_select_consolidated" ON "public"."xpms_atom_tiers" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."is_org_member"("a"."org_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]))))));



CREATE POLICY "xpms_atom_tiers_write__delete" ON "public"."xpms_atom_tiers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "xpms_atom_tiers_write__insert" ON "public"."xpms_atom_tiers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



CREATE POLICY "xpms_atom_tiers_write__update" ON "public"."xpms_atom_tiers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."xpms_atoms" "a"
  WHERE (("a"."id" = "xpms_atom_tiers"."atom_id") AND "private"."has_org_role"("a"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])))));



ALTER TABLE "public"."xpms_atoms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xpms_atoms_select_consolidated" ON "public"."xpms_atoms" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



CREATE POLICY "xpms_atoms_write__delete" ON "public"."xpms_atoms" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_atoms_write__insert" ON "public"."xpms_atoms" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_atoms_write__update" ON "public"."xpms_atoms" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_composition_write__delete" ON "public"."xpms_project_composition" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])))));



CREATE POLICY "xpms_composition_write__insert" ON "public"."xpms_project_composition" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])))));



CREATE POLICY "xpms_composition_write__update" ON "public"."xpms_project_composition" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"])))));



CREATE POLICY "xpms_edges_write__delete" ON "public"."xpms_provenance_edges" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_edges_write__insert" ON "public"."xpms_provenance_edges" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_edges_write__update" ON "public"."xpms_provenance_edges" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."xpms_project_composition" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xpms_project_composition_select_consolidated" ON "public"."xpms_project_composition" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."is_org_member"("p"."org_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "xpms_project_composition"."project_id") AND "private"."has_org_role"("p"."org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text"]))))));



ALTER TABLE "public"."xpms_provenance_edges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xpms_provenance_edges_select_consolidated" ON "public"."xpms_provenance_edges" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



ALTER TABLE "public"."xpms_variance_ledger" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xpms_variance_ledger_select_consolidated" ON "public"."xpms_variance_ledger" FOR SELECT USING (("private"."is_org_member"("org_id") OR "private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])));



CREATE POLICY "xpms_variance_write__delete" ON "public"."xpms_variance_ledger" FOR DELETE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_variance_write__insert" ON "public"."xpms_variance_ledger" FOR INSERT WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



CREATE POLICY "xpms_variance_write__update" ON "public"."xpms_variance_ledger" FOR UPDATE USING ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"])) WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::"text", 'admin'::"text", 'controller'::"text", 'collaborator'::"text"]));



ALTER TABLE "public"."xtc_classes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xtc_classes_read" ON "public"."xtc_classes" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."xtc_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xtc_codes_read" ON "public"."xtc_codes" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."xtc_divisions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xtc_divisions_read" ON "public"."xtc_divisions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."xtc_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xtc_sections_read" ON "public"."xtc_sections" FOR SELECT TO "authenticated" USING (true);



GRANT USAGE ON SCHEMA "private" TO "service_role";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "private"."auth_org_ids"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."auth_org_ids"() TO "service_role";
GRANT ALL ON FUNCTION "private"."auth_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "private"."auth_org_ids"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."auth_user_email"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."auth_user_email"() TO "service_role";
GRANT ALL ON FUNCTION "private"."auth_user_email"() TO "anon";
GRANT ALL ON FUNCTION "private"."auth_user_email"() TO "authenticated";



GRANT ALL ON FUNCTION "private"."effective_user_locale_settings"() TO "service_role";
GRANT ALL ON FUNCTION "private"."effective_user_locale_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "private"."effective_user_locale_settings"() TO "anon";



REVOKE ALL ON FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) TO "service_role";
GRANT ALL ON FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "private"."has_org_role"("target_org" "uuid", "required" "text"[]) TO "authenticated";



GRANT ALL ON FUNCTION "private"."has_project_role"("target_project" "uuid", "required" "text"[]) TO "service_role";
GRANT ALL ON FUNCTION "private"."has_project_role"("target_project" "uuid", "required" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "private"."has_project_role"("target_project" "uuid", "required" "text"[]) TO "authenticated";



GRANT ALL ON FUNCTION "private"."is_org_admin"("target_org" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."is_org_admin"("target_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."is_org_admin"("target_org" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "private"."is_org_manager_plus"("target_org" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."is_org_manager_plus"("target_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."is_org_manager_plus"("target_org" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."is_org_member"("target_org" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_org_member"("target_org" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."is_org_member"("target_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."is_org_member"("target_org" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "private"."is_project_member"("target_project" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."is_project_member"("target_project" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."is_project_member"("target_project" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."proposal_org_id"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."proposal_org_id"("p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."proposal_org_id"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."proposal_org_id"("p_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."accept_offer_letter"("p_token" "uuid", "p_code" "text", "p_signature" "text", "p_ip" "inet", "p_user_agent" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_offer_letter"("p_token" "uuid", "p_code" "text", "p_signature" "text", "p_ip" "inet", "p_user_agent" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."annotations_notify"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."annotations_notify"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_team_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bump_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_record"("p_table" "text", "p_id" "uuid", "p_op" "text") TO "service_role";



GRANT SELECT ON TABLE "public"."job_queue" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_jobs"("p_batch" integer, "p_visibility_s" integer, "p_worker" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_jobs"("p_batch" integer, "p_visibility_s" integer, "p_worker" "text") TO "service_role";



GRANT SELECT ON TABLE "public"."share_links" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."share_links" TO "authenticated";
GRANT ALL ON TABLE "public"."share_links" TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_share_link"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_share_link"("p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."consume_share_link"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."consume_share_link"("p_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_annotation"("p_org_id" "uuid", "p_project_id" "uuid", "p_target_table" "text", "p_target_id" "uuid", "p_kind" "public"."annotation_kind", "p_severity" "public"."annotation_severity", "p_title" "text", "p_body" "text", "p_tags" "text"[], "p_assigned_to" "uuid", "p_due_at" "date", "p_confirmation_required" boolean, "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_request_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."decline_offer_letter"("p_token" "uuid", "p_code" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decline_offer_letter"("p_token" "uuid", "p_code" "text", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."emit_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_title" "text", "p_body" "text", "p_href" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."emit_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_event_type" "text", "p_title" "text", "p_body" "text", "p_href" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_deliverable_deadline"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_offer_access_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_offer_letter_by_token"("p_token" "uuid", "p_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_offer_letter_by_token"("p_token" "uuid", "p_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_offer_letter_project_name"("p_token" "uuid", "p_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_offer_letter_project_name"("p_token" "uuid", "p_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_user_email_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_user_email_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_proposal_activity"("p_proposal_id" "uuid", "p_org_id" "uuid", "p_kind" "text", "p_actor_id" "uuid", "p_actor_label" "text", "p_target_kind" "text", "p_target_id" "uuid", "p_summary" "text", "p_meta" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_closed"("p_table" "text", "p_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."next_sequence"("p_org_id" "uuid", "p_scope" "text", "p_format" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."peek_sequence"("p_org_id" "uuid", "p_scope" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."peek_sequence"("p_org_id" "uuid", "p_scope" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."peek_sequence"("p_org_id" "uuid", "p_scope" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."project_members_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."proposal_change_orders_number"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reclaim_stuck_jobs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reclaim_stuck_jobs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_offer_letter_view"("p_token" "uuid", "p_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_offer_letter_view"("p_token" "uuid", "p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_role_for"("p_table" "text", "p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_cornbread_abbey_road"("p_org_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_salvage_city_ssot"("p_org_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."service_request_set_sla"() TO "service_role";



GRANT ALL ON FUNCTION "public"."snapshot_deliverable_on_submit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."snapshot_offer_letter"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_budget_for_bucket"("p_org_id" "uuid", "p_project_id" "uuid", "p_category" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_budget_for_bucket"("p_org_id" "uuid", "p_project_id" "uuid", "p_category" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."tg_audit_log"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tg_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_check_vendor_compliance"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tg_compute_time_entry_duration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tg_compute_time_entry_duration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_dashboards_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_import_jobs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_project_templates_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_share_links_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tg_sync_budget_spent_on_expense"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tg_sync_budget_spent_on_expense"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tg_sync_budget_spent_on_invoice"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tg_sync_budget_spent_on_invoice"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_teams_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_view_configs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."xpms_build_identifier"("p_org_token" "text", "p_event_token" "text", "p_event_year" smallint, "p_venue_token" "text", "p_class" smallint, "p_division" smallint, "p_section" smallint, "p_zone_token" "text", "p_sequence_no" integer, "p_revision" "text") TO "service_role";



GRANT SELECT ON TABLE "public"."access_scans" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."access_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."access_scans" TO "service_role";



GRANT SELECT ON TABLE "public"."accommodation_blocks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accommodation_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."accommodation_blocks" TO "service_role";



GRANT SELECT ON TABLE "public"."accreditation_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accreditation_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."accreditation_categories" TO "service_role";



GRANT SELECT ON TABLE "public"."accreditation_changes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accreditation_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."accreditation_changes" TO "service_role";



GRANT SELECT ON TABLE "public"."accreditations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accreditations" TO "authenticated";
GRANT ALL ON TABLE "public"."accreditations" TO "service_role";



GRANT SELECT ON TABLE "public"."ad_manifests" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ad_manifests" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_manifests" TO "service_role";



GRANT SELECT ON TABLE "public"."ai_agents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ai_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agents" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT SELECT ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ai_messages" TO "authenticated";
GRANT SELECT ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT SELECT ON TABLE "public"."annotation_watchers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."annotation_watchers" TO "authenticated";
GRANT ALL ON TABLE "public"."annotation_watchers" TO "service_role";



GRANT SELECT ON TABLE "public"."annotations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."annotations" TO "service_role";



GRANT SELECT ON TABLE "public"."api_keys" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT SELECT ON TABLE "public"."asset_links" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."asset_links" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_links" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audit_log" TO "authenticated";
GRANT SELECT ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT SELECT ON TABLE "public"."automation_runs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_runs" TO "service_role";



GRANT SELECT ON TABLE "public"."automation_schedules" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_schedules" TO "service_role";



GRANT SELECT ON TABLE "public"."automation_step_runs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_step_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_step_runs" TO "service_role";



GRANT SELECT ON TABLE "public"."automation_subscriptions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automation_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_subscriptions" TO "service_role";



GRANT SELECT ON TABLE "public"."automations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."budgets" TO "authenticated";
GRANT SELECT ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT SELECT ON TABLE "public"."campaigns" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT SELECT ON TABLE "public"."case_studies" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."case_studies" TO "authenticated";
GRANT ALL ON TABLE "public"."case_studies" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clients" TO "authenticated";
GRANT SELECT ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT SELECT ON TABLE "public"."consent_records" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."consent_records" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_records" TO "service_role";



GRANT SELECT ON TABLE "public"."conversation_messages" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT SELECT ON TABLE "public"."conversations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT SELECT ON TABLE "public"."cost_codes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cost_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_codes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."credentials" TO "authenticated";
GRANT SELECT ON TABLE "public"."credentials" TO "anon";
GRANT ALL ON TABLE "public"."credentials" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."crew_members" TO "authenticated";
GRANT SELECT ON TABLE "public"."crew_members" TO "anon";
GRANT ALL ON TABLE "public"."crew_members" TO "service_role";



GRANT SELECT ON TABLE "public"."crisis_alert_receipts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."crisis_alert_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."crisis_alert_receipts" TO "service_role";



GRANT SELECT ON TABLE "public"."crisis_alerts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."crisis_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."crisis_alerts" TO "service_role";



GRANT SELECT ON TABLE "public"."cues" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."cues" TO "authenticated";
GRANT ALL ON TABLE "public"."cues" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_log_deliveries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_log_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_log_deliveries" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_log_equipment" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_log_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_log_equipment" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_log_manpower" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_log_manpower" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_log_manpower" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_log_photos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_log_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_log_photos" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_log_visitors" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_log_visitors" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_log_visitors" TO "service_role";



GRANT SELECT ON TABLE "public"."daily_logs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."daily_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_logs" TO "service_role";



GRANT SELECT ON TABLE "public"."dashboards" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dashboards" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboards" TO "service_role";



GRANT SELECT ON TABLE "public"."delegation_entries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegation_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."delegation_entries" TO "service_role";



GRANT SELECT ON TABLE "public"."delegations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."delegations" TO "authenticated";
GRANT ALL ON TABLE "public"."delegations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."deliverable_comments" TO "authenticated";
GRANT SELECT ON TABLE "public"."deliverable_comments" TO "anon";
GRANT ALL ON TABLE "public"."deliverable_comments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."deliverable_history" TO "authenticated";
GRANT SELECT ON TABLE "public"."deliverable_history" TO "anon";
GRANT ALL ON TABLE "public"."deliverable_history" TO "service_role";



GRANT SELECT ON TABLE "public"."deliverable_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."deliverable_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."deliverable_templates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."deliverables" TO "authenticated";
GRANT SELECT ON TABLE "public"."deliverables" TO "anon";
GRANT ALL ON TABLE "public"."deliverables" TO "service_role";



GRANT SELECT ON TABLE "public"."dispatch_runs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dispatch_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."dispatch_runs" TO "service_role";



GRANT SELECT ON TABLE "public"."domain_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."domain_events" TO "authenticated";
GRANT ALL ON TABLE "public"."domain_events" TO "service_role";



GRANT SELECT ON TABLE "public"."dsar_requests" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dsar_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."dsar_requests" TO "service_role";



GRANT SELECT ON TABLE "public"."email_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT SELECT ON TABLE "public"."environmental_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."environmental_events" TO "authenticated";
GRANT ALL ON TABLE "public"."environmental_events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."equipment" TO "authenticated";
GRANT SELECT ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."event_guides" TO "authenticated";
GRANT SELECT ON TABLE "public"."event_guides" TO "anon";
GRANT ALL ON TABLE "public"."event_guides" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."events" TO "authenticated";
GRANT SELECT ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."expenses" TO "authenticated";
GRANT SELECT ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT SELECT ON TABLE "public"."export_runs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."export_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."export_runs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."fabrication_orders" TO "authenticated";
GRANT SELECT ON TABLE "public"."fabrication_orders" TO "anon";
GRANT ALL ON TABLE "public"."fabrication_orders" TO "service_role";



GRANT SELECT ON TABLE "public"."form_defs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."form_defs" TO "authenticated";
GRANT ALL ON TABLE "public"."form_defs" TO "service_role";



GRANT SELECT ON TABLE "public"."form_submissions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT SELECT ON TABLE "public"."gdpr_user_expenses" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gdpr_user_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_user_expenses" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."mileage_logs" TO "authenticated";
GRANT SELECT ON TABLE "public"."mileage_logs" TO "anon";
GRANT ALL ON TABLE "public"."mileage_logs" TO "service_role";



GRANT SELECT ON TABLE "public"."gdpr_user_mileage_logs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gdpr_user_mileage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_user_mileage_logs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."time_entries" TO "authenticated";
GRANT SELECT ON TABLE "public"."time_entries" TO "anon";
GRANT ALL ON TABLE "public"."time_entries" TO "service_role";



GRANT SELECT ON TABLE "public"."gdpr_user_time_entries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gdpr_user_time_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_user_time_entries" TO "service_role";



GRANT SELECT ON TABLE "public"."governance_committees" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."governance_committees" TO "authenticated";
GRANT ALL ON TABLE "public"."governance_committees" TO "service_role";



GRANT SELECT ON TABLE "public"."governance_policies" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."governance_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."governance_policies" TO "service_role";



GRANT SELECT ON TABLE "public"."guard_tours" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."guard_tours" TO "authenticated";
GRANT ALL ON TABLE "public"."guard_tours" TO "service_role";



GRANT SELECT ON TABLE "public"."guide_comments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."guide_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."guide_comments" TO "service_role";



GRANT SELECT ON TABLE "public"."idempotency_keys" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."idempotency_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "service_role";



GRANT SELECT ON TABLE "public"."import_jobs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."import_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_jobs" TO "service_role";



GRANT SELECT ON TABLE "public"."import_runs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."import_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_runs" TO "service_role";



GRANT SELECT ON TABLE "public"."incidents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."incidents" TO "service_role";



GRANT SELECT ON TABLE "public"."inspection_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inspection_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_items" TO "service_role";



GRANT SELECT ON TABLE "public"."inspection_template_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inspection_template_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_template_items" TO "service_role";



GRANT SELECT ON TABLE "public"."inspection_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inspection_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_templates" TO "service_role";



GRANT SELECT ON TABLE "public"."inspections" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."inspections" TO "service_role";



GRANT SELECT ON TABLE "public"."insurance_policies" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."insurance_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."insurance_policies" TO "service_role";



GRANT SELECT ON TABLE "public"."integration_connectors" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."integration_connectors" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_connectors" TO "service_role";



GRANT SELECT ON TABLE "public"."invites" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invoice_line_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."invoice_line_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invoices" TO "authenticated";
GRANT SELECT ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT SELECT ON TABLE "public"."itil_changes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."itil_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."itil_changes" TO "service_role";



GRANT SELECT ON TABLE "public"."itil_problems" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."itil_problems" TO "authenticated";
GRANT ALL ON TABLE "public"."itil_problems" TO "service_role";



GRANT SELECT ON TABLE "public"."kb_articles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."kb_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."kb_articles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."leads" TO "authenticated";
GRANT SELECT ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."locations" TO "authenticated";
GRANT SELECT ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT SELECT ON TABLE "public"."maintenance_jobs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."maintenance_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_jobs" TO "service_role";



GRANT SELECT ON TABLE "public"."maintenance_schedules" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."maintenance_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_schedules" TO "service_role";



GRANT SELECT ON TABLE "public"."major_incidents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."major_incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."major_incidents" TO "service_role";



GRANT SELECT ON TABLE "public"."medical_encounters" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."medical_encounters" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_encounters" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."memberships" TO "authenticated";
GRANT SELECT ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT SELECT ON TABLE "public"."mfa_recovery_codes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."mfa_recovery_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."mfa_recovery_codes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT SELECT ON TABLE "public"."offer_letter_activity" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."offer_letter_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_letter_activity" TO "service_role";



GRANT SELECT ON TABLE "public"."offer_letters" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."offer_letters" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_letters" TO "service_role";



GRANT SELECT ON TABLE "public"."org_offer_letter_settings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_offer_letter_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."org_offer_letter_settings" TO "service_role";



GRANT SELECT ON TABLE "public"."org_roles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."org_roles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."projects" TO "authenticated";
GRANT SELECT ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT SELECT ON TABLE "public"."rate_card_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rate_card_items" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_card_items" TO "service_role";



GRANT SELECT ON TABLE "public"."venues" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT SELECT ON TABLE "public"."offer_letters_resolved" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."offer_letters_resolved" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_letters_resolved" TO "service_role";



GRANT SELECT ON TABLE "public"."org_domains" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."org_domains" TO "service_role";



GRANT SELECT ON TABLE "public"."org_event_log_destinations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_event_log_destinations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_event_log_destinations" TO "service_role";



GRANT SELECT ON TABLE "public"."org_integrations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_integrations" TO "service_role";



GRANT SELECT ON TABLE "public"."org_ip_allowlist" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_ip_allowlist" TO "authenticated";
GRANT ALL ON TABLE "public"."org_ip_allowlist" TO "service_role";



GRANT SELECT ON TABLE "public"."org_scim_tokens" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_scim_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."org_scim_tokens" TO "service_role";



GRANT SELECT ON TABLE "public"."org_sequences" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."org_sequences" TO "service_role";



GRANT SELECT ON TABLE "public"."org_sso_providers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."org_sso_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."org_sso_providers" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."orgs" TO "authenticated";
GRANT SELECT ON TABLE "public"."orgs" TO "anon";
GRANT ALL ON TABLE "public"."orgs" TO "service_role";



GRANT SELECT("branding") ON TABLE "public"."orgs" TO "anon";



GRANT SELECT("name_override") ON TABLE "public"."orgs" TO "anon";



GRANT SELECT("logo_url") ON TABLE "public"."orgs" TO "anon";



GRANT SELECT("support_email") ON TABLE "public"."orgs" TO "anon";



GRANT SELECT ON TABLE "public"."payment_application_lines" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."payment_application_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_application_lines" TO "service_role";



GRANT SELECT ON TABLE "public"."payment_applications" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."payment_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_applications" TO "service_role";



GRANT SELECT ON TABLE "public"."playbooks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."playbooks" TO "service_role";



GRANT SELECT ON TABLE "public"."po_change_order_lines" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."po_change_order_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."po_change_order_lines" TO "service_role";



GRANT SELECT ON TABLE "public"."po_change_orders" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."po_change_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."po_change_orders" TO "service_role";



GRANT SELECT ON TABLE "public"."po_checklist_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."po_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."po_checklist_items" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."po_line_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."po_line_items" TO "anon";
GRANT ALL ON TABLE "public"."po_line_items" TO "service_role";



GRANT SELECT ON TABLE "public"."prequalification_questionnaires" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."prequalification_questionnaires" TO "authenticated";
GRANT ALL ON TABLE "public"."prequalification_questionnaires" TO "service_role";



GRANT SELECT ON TABLE "public"."prequalification_questions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."prequalification_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."prequalification_questions" TO "service_role";



GRANT SELECT ON TABLE "public"."program_reviews" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."program_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."program_reviews" TO "service_role";



GRANT SELECT ON TABLE "public"."project_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT SELECT ON TABLE "public"."project_photos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."project_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."project_photos" TO "service_role";



GRANT SELECT ON TABLE "public"."project_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."project_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_templates" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_activity" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_activity" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_approvals" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_approvals" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_change_orders" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_change_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_change_orders" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_events" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_events" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_files" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_files" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_files" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_gate_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_gate_items" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_gate_items" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_phase_states" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_phase_states" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_phase_states" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_revision_rounds" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_revision_rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_revision_rounds" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_revisions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_revisions" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_share_links" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_share_links" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_share_links" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_signatures" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_signatures" TO "service_role";



GRANT SELECT ON TABLE "public"."proposal_versions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposal_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_versions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."proposals" TO "authenticated";
GRANT SELECT ON TABLE "public"."proposals" TO "anon";
GRANT ALL ON TABLE "public"."proposals" TO "service_role";



GRANT SELECT ON TABLE "public"."punch_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."punch_items" TO "authenticated";
GRANT ALL ON TABLE "public"."punch_items" TO "service_role";



GRANT SELECT ON TABLE "public"."punch_lists" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."punch_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."punch_lists" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT SELECT ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT SELECT ON TABLE "public"."push_subscriptions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT SELECT ON TABLE "public"."rate_card_orders" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rate_card_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_card_orders" TO "service_role";



GRANT SELECT ON TABLE "public"."rate_limit_overrides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rate_limit_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_overrides" TO "service_role";



GRANT SELECT ON TABLE "public"."readiness_exercises" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."readiness_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."readiness_exercises" TO "service_role";



GRANT SELECT ON TABLE "public"."record_grants" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."record_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."record_grants" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rentals" TO "authenticated";
GRANT SELECT ON TABLE "public"."rentals" TO "anon";
GRANT ALL ON TABLE "public"."rentals" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."requisitions" TO "authenticated";
GRANT SELECT ON TABLE "public"."requisitions" TO "anon";
GRANT ALL ON TABLE "public"."requisitions" TO "service_role";



GRANT SELECT ON TABLE "public"."rfis" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rfis" TO "authenticated";
GRANT ALL ON TABLE "public"."rfis" TO "service_role";



GRANT SELECT ON TABLE "public"."rfq_response_lines" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rfq_response_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."rfq_response_lines" TO "service_role";



GRANT SELECT ON TABLE "public"."rfq_responses" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rfq_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."rfq_responses" TO "service_role";



GRANT SELECT ON TABLE "public"."rfqs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rfqs" TO "authenticated";
GRANT ALL ON TABLE "public"."rfqs" TO "service_role";



GRANT SELECT ON TABLE "public"."risks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."risks" TO "authenticated";
GRANT ALL ON TABLE "public"."risks" TO "service_role";



GRANT SELECT ON TABLE "public"."rosters" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rosters" TO "authenticated";
GRANT ALL ON TABLE "public"."rosters" TO "service_role";



GRANT SELECT ON TABLE "public"."safeguarding_reports" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."safeguarding_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."safeguarding_reports" TO "service_role";



GRANT SELECT ON TABLE "public"."safety_briefing_attendees" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."safety_briefing_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."safety_briefing_attendees" TO "service_role";



GRANT SELECT ON TABLE "public"."safety_briefings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."safety_briefings" TO "authenticated";
GRANT ALL ON TABLE "public"."safety_briefings" TO "service_role";



GRANT SELECT ON TABLE "public"."service_request_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."service_request_events" TO "authenticated";
GRANT ALL ON TABLE "public"."service_request_events" TO "service_role";



GRANT SELECT ON TABLE "public"."service_requests" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT SELECT ON TABLE "public"."service_sla_policies" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."service_sla_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."service_sla_policies" TO "service_role";



GRANT SELECT ON TABLE "public"."shifts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT SELECT ON TABLE "public"."site_plan_pins" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."site_plan_pins" TO "authenticated";
GRANT ALL ON TABLE "public"."site_plan_pins" TO "service_role";



GRANT SELECT ON TABLE "public"."site_plan_revisions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."site_plan_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."site_plan_revisions" TO "service_role";



GRANT SELECT ON TABLE "public"."site_plans" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."site_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."site_plans" TO "service_role";



GRANT SELECT ON TABLE "public"."slack_channel_mappings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."slack_channel_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_channel_mappings" TO "service_role";



GRANT SELECT ON TABLE "public"."slack_user_links" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."slack_user_links" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_user_links" TO "service_role";



GRANT SELECT ON TABLE "public"."slack_workspaces" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."slack_workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."slack_workspaces" TO "service_role";



GRANT SELECT ON TABLE "public"."sponsor_entitlements" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."sponsor_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsor_entitlements" TO "service_role";



GRANT SELECT ON TABLE "public"."stage_plots" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stage_plots" TO "authenticated";
GRANT ALL ON TABLE "public"."stage_plots" TO "service_role";



GRANT SELECT ON TABLE "public"."stripe_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."stripe_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events" TO "service_role";



GRANT SELECT ON TABLE "public"."submittal_revisions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."submittal_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."submittal_revisions" TO "service_role";



GRANT SELECT ON TABLE "public"."submittals" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."submittals" TO "authenticated";
GRANT ALL ON TABLE "public"."submittals" TO "service_role";



GRANT SELECT ON TABLE "public"."sustainability_metrics" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."sustainability_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."sustainability_metrics" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tasks" TO "authenticated";
GRANT SELECT ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT SELECT ON TABLE "public"."team_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT SELECT ON TABLE "public"."teams" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT SELECT ON TABLE "public"."threats" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."threats" TO "authenticated";
GRANT ALL ON TABLE "public"."threats" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ticket_scans" TO "authenticated";
GRANT SELECT ON TABLE "public"."ticket_scans" TO "anon";
GRANT ALL ON TABLE "public"."ticket_scans" TO "service_role";



GRANT SELECT ON TABLE "public"."ticket_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tickets" TO "authenticated";
GRANT SELECT ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT SELECT ON TABLE "public"."trademarks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."trademarks" TO "authenticated";
GRANT ALL ON TABLE "public"."trademarks" TO "service_role";



GRANT SELECT ON TABLE "public"."usage_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_events" TO "service_role";



GRANT SELECT ON TABLE "public"."usage_rollups" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."usage_rollups" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_rollups" TO "service_role";



GRANT SELECT ON TABLE "public"."user_passkeys" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_passkeys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_passkeys" TO "service_role";



GRANT SELECT ON TABLE "public"."user_preferences" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT SELECT ON TABLE "public"."v_action_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_action_items" TO "authenticated";
GRANT ALL ON TABLE "public"."v_action_items" TO "service_role";



GRANT SELECT ON TABLE "public"."v_budget_health" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_budget_health" TO "authenticated";
GRANT ALL ON TABLE "public"."v_budget_health" TO "service_role";



GRANT SELECT ON TABLE "public"."xpms_atom_tiers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xpms_atom_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."xpms_atom_tiers" TO "service_role";



GRANT SELECT ON TABLE "public"."xpms_atoms" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xpms_atoms" TO "authenticated";
GRANT ALL ON TABLE "public"."xpms_atoms" TO "service_role";



GRANT SELECT ON TABLE "public"."v_xpms_atom_tier_composition" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_xpms_atom_tier_composition" TO "authenticated";
GRANT ALL ON TABLE "public"."v_xpms_atom_tier_composition" TO "service_role";



GRANT SELECT ON TABLE "public"."xpms_variance_ledger" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xpms_variance_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."xpms_variance_ledger" TO "service_role";



GRANT SELECT ON TABLE "public"."v_xpms_variance_summary" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_xpms_variance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_xpms_variance_summary" TO "service_role";



GRANT SELECT ON TABLE "public"."xtc_classes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xtc_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."xtc_classes" TO "service_role";



GRANT SELECT ON TABLE "public"."xtc_codes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xtc_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."xtc_codes" TO "service_role";



GRANT SELECT ON TABLE "public"."xtc_divisions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xtc_divisions" TO "authenticated";
GRANT ALL ON TABLE "public"."xtc_divisions" TO "service_role";



GRANT SELECT ON TABLE "public"."xtc_sections" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xtc_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."xtc_sections" TO "service_role";



GRANT SELECT ON TABLE "public"."v_xtc_codebook" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_xtc_codebook" TO "authenticated";
GRANT ALL ON TABLE "public"."v_xtc_codebook" TO "service_role";



GRANT SELECT ON TABLE "public"."vendor_prequalification_answers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vendor_prequalification_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_prequalification_answers" TO "service_role";



GRANT SELECT ON TABLE "public"."vendor_prequalifications" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vendor_prequalifications" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_prequalifications" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."vendors" TO "authenticated";
GRANT SELECT ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_build_log" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_build_log" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_build_log" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_certifications" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_certifications" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_closeout_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_closeout_items" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_closeout_items" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_design_specs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_design_specs" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_design_specs" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_handover_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_handover_items" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_handover_items" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_vop_sections" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_vop_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_vop_sections" TO "service_role";



GRANT SELECT ON TABLE "public"."venue_zones" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."venue_zones" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_zones" TO "service_role";



GRANT SELECT ON TABLE "public"."view_configs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."view_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."view_configs" TO "service_role";



GRANT SELECT ON TABLE "public"."visa_cases" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."visa_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."visa_cases" TO "service_role";



GRANT SELECT ON TABLE "public"."webauthn_challenges" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."webauthn_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."webauthn_challenges" TO "service_role";



GRANT SELECT ON TABLE "public"."webhook_deliveries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."webhook_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_deliveries" TO "service_role";



GRANT SELECT ON TABLE "public"."webhook_endpoints" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."webhook_endpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_endpoints" TO "service_role";



GRANT SELECT ON TABLE "public"."work_order_broadcast_invites" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."work_order_broadcast_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_broadcast_invites" TO "service_role";



GRANT SELECT ON TABLE "public"."work_order_broadcasts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."work_order_broadcasts" TO "authenticated";
GRANT ALL ON TABLE "public"."work_order_broadcasts" TO "service_role";



GRANT SELECT ON TABLE "public"."workforce_deployments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workforce_deployments" TO "authenticated";
GRANT ALL ON TABLE "public"."workforce_deployments" TO "service_role";



GRANT SELECT ON TABLE "public"."workforce_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."workforce_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workforce_members" TO "service_role";



GRANT SELECT ON TABLE "public"."xpms_project_composition" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xpms_project_composition" TO "authenticated";
GRANT ALL ON TABLE "public"."xpms_project_composition" TO "service_role";



GRANT SELECT ON TABLE "public"."xpms_provenance_edges" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."xpms_provenance_edges" TO "authenticated";
GRANT ALL ON TABLE "public"."xpms_provenance_edges" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




