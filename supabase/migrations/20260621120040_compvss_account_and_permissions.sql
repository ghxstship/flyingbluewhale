-- ── user_account_status (1:1 account lifecycle — owner managed) ───────────
-- LDP: account_state is the cyclical operational lifecycle of the user account.
create table public.user_account_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_state text not null default 'active' check (account_state in ('active','paused','archived')),
  paused_until timestamptz,
  pause_reason text,
  archive_requested_at timestamptz,
  archived_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_account_status enable row level security;
create policy user_account_status_all on public.user_account_status for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_user_account_status_updated before update on public.user_account_status for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.user_account_status to authenticated;

-- ── user_app_permissions (1:1 native/web permission grants + language) ─────
create table public.user_app_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  location_granted boolean not null default false,
  notifications_granted boolean not null default false,
  camera_granted boolean not null default false,
  bluetooth_granted boolean not null default false,
  language text,
  location_requested_at timestamptz,
  notifications_requested_at timestamptz,
  camera_requested_at timestamptz,
  bluetooth_requested_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.user_app_permissions enable row level security;
create policy user_app_permissions_all on public.user_app_permissions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_user_app_permissions_updated before update on public.user_app_permissions for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.user_app_permissions to authenticated;
