-- ============================================
-- RP Dev-Ops Dashboard — Supabase Schema
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUM: user roles
-- ============================================
create type user_role as enum ('owner', 'developer', 'admin');

-- ============================================
-- TABLE: profiles
-- Synced from auth.users via trigger.
-- ============================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  github_username text unique,
  avatar_url  text,
  full_name   text,
  role        user_role not null default 'developer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, github_username, avatar_url, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- TABLE: projects
-- Tracked GitHub repositories / game servers.
-- ============================================
create table projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  github_repo text not null unique,   -- "org/repo" format
  description text,
  server_ip   text,                   -- optional: game server IP
  is_active   boolean not null default true,
  added_by    uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================
-- TABLE: audit_logs
-- Immutable action log for the Activity page.
-- ============================================
create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete set null,
  action      text not null,          -- e.g. "settings.update", "project.add"
  target      text,                   -- e.g. "project:fivem-server"
  metadata    jsonb default '{}',     -- arbitrary extra data
  created_at  timestamptz not null default now()
);

create index idx_audit_logs_user    on audit_logs(user_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: everyone can read, only owner can update own profile
alter table profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Projects: authenticated can read, owner/admin can insert/update
alter table projects enable row level security;

create policy "Projects are viewable by authenticated users"
  on projects for select
  to authenticated
  using (true);

create policy "Owner and Admin can manage projects"
  on projects for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'admin')
    )
  );

-- Audit logs: authenticated can read, insert via service role or RPC
alter table audit_logs enable row level security;

create policy "Audit logs are viewable by authenticated users"
  on audit_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert audit logs"
  on audit_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ============================================
-- HELPER: RPC to log audit events
-- ============================================
create or replace function public.log_audit(
  p_action text,
  p_target text default null,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into audit_logs (user_id, action, target, metadata)
  values (auth.uid(), p_action, p_target, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;
