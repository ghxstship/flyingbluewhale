-- Remediation B: promote service_requests.request_state + severity and
-- service_sla_policies.severity to native enums. APPLIED 2026-07-18 (ledger 20260718152411).
-- Trigger service_request_set_sla compares severity = new.severity → enum=enum once both
-- share sla_severity (no change needed). CHECK names: service_requests_status_check
-- (request_state), service_requests_severity_check, service_sla_policies_severity_check.
-- Plain indexes (idx_service_requests_org_status, service_sla_policies_org_id_severity_key)
-- auto-rebuild.
create type public.service_request_state as enum ('open','acknowledged','in_progress','resolved','cancelled');
create type public.sla_severity as enum ('P1','P2','P3','P4');

alter table public.service_requests drop constraint if exists service_requests_status_check;
alter table public.service_requests drop constraint if exists service_requests_severity_check;
alter table public.service_requests alter column request_state drop default;
alter table public.service_requests alter column request_state type public.service_request_state using request_state::public.service_request_state;
alter table public.service_requests alter column request_state set default 'open';
alter table public.service_requests alter column severity drop default;
alter table public.service_requests alter column severity type public.sla_severity using severity::public.sla_severity;
alter table public.service_requests alter column severity set default 'P3';

alter table public.service_sla_policies drop constraint if exists service_sla_policies_severity_check;
alter table public.service_sla_policies alter column severity type public.sla_severity using severity::public.sla_severity;
