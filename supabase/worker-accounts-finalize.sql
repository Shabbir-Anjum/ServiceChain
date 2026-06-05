-- ServiceChain — Migration part 2 (finalize). IDEMPOTENT — safe to re-run.
-- Run in the Supabase SQL editor AFTER:
--   1) worker-accounts.sql
--   2) node scripts/seed-workers.js   (populates worker_id_map)
-- Remaps historical jobs.worker_id text→uuid, retypes the column, drops leftovers.
-- Each step is guarded so partial prior runs don't error.

do $$
declare
  wid_type text;
begin
  select data_type into wid_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'jobs' and column_name = 'worker_id';

  -- Only do the text→uuid remap + retype if the column is still text.
  if wid_type = 'text' then
    -- 8a. translate old ghost ids (w1..w20) to the new auth uuids
    update jobs j set worker_id = m.new_id::text
    from worker_id_map m where j.worker_id = m.old_id;

    -- 8b. drop old FK
    alter table jobs drop constraint if exists jobs_worker_id_fkey;

    -- 8c. null anything that still isn't a uuid (display lives in jobs.worker jsonb)
    update jobs set worker_id = null
    where worker_id is not null
      and worker_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    -- 8d. drop the policy that depends on worker_id (blocks the type change)
    drop policy if exists "jobs visible by role" on jobs;

    -- 8e. retype to uuid
    alter table jobs alter column worker_id type uuid using worker_id::uuid;
  end if;
end $$;

-- 8f. ensure the FK to profiles(id) exists (no-op if already there)
alter table jobs drop constraint if exists jobs_worker_id_fkey;
alter table jobs
  add constraint jobs_worker_id_fkey
  foreign key (worker_id) references profiles(id) on delete set null;
create index if not exists jobs_worker_idx on jobs (worker_id);

-- 8g. (re)create the visibility policy with a uuid compare
drop policy if exists "jobs visible by role" on jobs;
create policy "jobs visible by role" on jobs
  for select to authenticated using (
    public.my_role() = 'admin'
    or client_id = auth.uid()
    or (public.my_role() = 'worker' and worker_id = auth.uid())
  );

-- ── Step 9: drop redundant pieces ─────────────────────────────────
alter table profiles drop column if exists worker_id;
drop function if exists public.my_worker_id();

-- Keep workers_legacy + worker_id_map until you've verified everything, then:
-- drop table worker_id_map;
-- drop table workers_legacy;
