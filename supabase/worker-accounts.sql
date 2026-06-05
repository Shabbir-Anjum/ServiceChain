-- ServiceChain — Migration: ghost workers → real worker accounts.
-- Run in the Supabase SQL editor AFTER schema.sql + auth-schema.sql.
-- Merges worker fields into `profiles`, makes `workers` a VIEW, retypes
-- jobs.worker_id to uuid. Idempotent where practical. Do this in one pass.

-- ── Step 0: preserve the 20 ghosts (never drop — rename) ──────────
alter table if exists workers rename to workers_legacy;

-- ── Step 1: worker fields on profiles ─────────────────────────────
alter table profiles
  add column if not exists wallet         text,
  add column if not exists job_role       text,         -- "Plumber", "Electrician"
  add column if not exists emoji          text,
  add column if not exists skills         text[]  not null default '{}',
  add column if not exists hourly_rate    numeric,
  add column if not exists available_days text[]  not null default '{}',  -- {'Mon','Tue',...}
  add column if not exists hours_from     time,
  add column if not exists hours_to       time,
  add column if not exists bio            text,
  add column if not exists location       text,
  add column if not exists rating         numeric default 5,
  add column if not exists jobs_done      int     default 0,
  add column if not exists available      boolean default true;

-- ── Step 2: profile_complete as a generated (un-fakeable) column ──
alter table profiles drop column if exists profile_complete;
alter table profiles
  add column profile_complete boolean
  generated always as (
    role = 'worker'
    and wallet      is not null and length(trim(wallet)) > 0
    and job_role    is not null and length(trim(job_role)) > 0
    and hourly_rate is not null and hourly_rate > 0
    and array_length(skills, 1) >= 1
    and array_length(available_days, 1) >= 1
    and hours_from  is not null
    and hours_to    is not null
  ) stored;

-- ── Step 3: wallet format guard (lenient on legacy) ───────────────
alter table profiles drop constraint if exists profiles_wallet_format;
alter table profiles
  add constraint profiles_wallet_format
  check (wallet is null or wallet ~ '^0x[0-9a-fA-F]{40}$')
  not valid;

-- ── Step 4: trigger no longer copies a ghost worker_id ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── Step 5: id-map table for remapping historical jobs ────────────
create table if not exists worker_id_map (
  old_id text primary key,
  new_id uuid not null references auth.users(id) on delete cascade
);
-- (the seed script populates this; run Step 7 AFTER seeding)

-- ── Step 6: recreate `workers` as a VIEW (keeps app queries working)
create or replace view public.workers as
select
  p.id,
  p.full_name as name,
  p.job_role  as role,
  p.emoji,
  p.skills,
  p.rating,
  p.jobs_done,
  p.available,
  p.location,
  p.bio       as tagline,
  p.wallet,
  p.hourly_rate,
  p.available_days,
  p.hours_from,
  p.hours_to
from public.profiles p
where p.role = 'worker' and p.profile_complete = true;

alter view public.workers set (security_invoker = on);

-- ── Step 7: RLS — public marketplace read + column lockdown ───────
-- Public can read complete worker rows (the marketplace). Existing
-- "read own profile" / "update own profile" policies remain (additive).
drop policy if exists "public read complete workers" on profiles;
create policy "public read complete workers" on profiles
  for select to anon, authenticated
  using (role = 'worker' and profile_complete = true);

-- Anon may only read display columns — never wallet/email. The agent reads
-- wallet via the SERVICE ROLE (bypasses RLS + column grants).
revoke select on public.profiles from anon;
grant select (id, full_name, job_role, emoji, skills, rating, jobs_done,
              available, location, bio, profile_complete, role,
              available_days, hours_from, hours_to)
  on public.profiles to anon;

-- jobs visibility: worker's jobs are worker_id = their own auth uid now.
-- (jobs.worker_id is still text at this point; compare as text.)
drop policy if exists "jobs visible by role" on jobs;
create policy "jobs visible by role" on jobs
  for select to authenticated using (
    public.my_role() = 'admin'
    or client_id = auth.uid()
    or (public.my_role() = 'worker' and worker_id = auth.uid()::text)
  );

-- ════════════════════════════════════════════════════════════════
-- STOP HERE. Now run:  node scripts/seed-workers.js
-- It creates the 20 worker accounts and fills worker_id_map.
-- THEN run the second migration file: worker-accounts-finalize.sql
-- (which remaps historical jobs + retypes jobs.worker_id to uuid).
-- ════════════════════════════════════════════════════════════════
