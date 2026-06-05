-- ServiceChain — Auth + Roles schema.
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Adds: profiles table (roles), auto-create trigger, job ownership columns, RLS.
-- Safe to re-run (idempotent where practical).

-- ── Profiles: one row per auth user, holds their role ──────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'client',   -- 'client' | 'worker' | 'admin'
  worker_id  text references workers(id),        -- set when role = 'worker'
  created_at timestamptz default now()
);

-- ── Trigger: auto-create a profile when a user signs up ───────────
-- Reads role + full_name + worker_id from the signup metadata
-- (supabase.auth.signUp({ options: { data: {...} } })). Defaults to 'client'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, worker_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    nullif(new.raw_user_meta_data->>'worker_id', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Job ownership columns ─────────────────────────────────────────
alter table jobs add column if not exists client_id uuid references auth.users(id);
alter table jobs add column if not exists worker_id text references workers(id);
create index if not exists jobs_client_idx on jobs (client_id);
create index if not exists jobs_worker_idx on jobs (worker_id);

-- ── Helper: current user's role (avoids RLS recursion) ────────────
create or replace function public.my_role()
returns text
language sql
security definer set search_path = public
stable
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_worker_id()
returns text
language sql
security definer set search_path = public
stable
as $$ select worker_id from public.profiles where id = auth.uid() $$;

-- ── RLS: profiles ─────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles
  for select to authenticated using (id = auth.uid() or public.my_role() = 'admin');

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update to authenticated using (id = auth.uid());

-- ── RLS: jobs ─────────────────────────────────────────────────────
-- NOTE: the autonomous agent writes via the SERVICE ROLE key, which bypasses
-- RLS entirely. These policies govern only authenticated human users.
alter table jobs enable row level security;

drop policy if exists "jobs visible by role" on jobs;
create policy "jobs visible by role" on jobs
  for select to authenticated using (
    public.my_role() = 'admin'
    or client_id = auth.uid()
    or (public.my_role() = 'worker' and worker_id = public.my_worker_id())
  );

-- ── RLS: agent_logs (admin read only) ─────────────────────────────
alter table agent_logs enable row level security;
drop policy if exists "agent_logs admin read" on agent_logs;
create policy "agent_logs admin read" on agent_logs
  for select to authenticated using (public.my_role() = 'admin');

-- ── After your first signup, make yourself admin: ─────────────────
-- update profiles set role = 'admin' where email = 'YОUR_EMAIL_HERE';
