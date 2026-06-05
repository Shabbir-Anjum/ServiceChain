-- ServiceChain — Supabase schema for the AI Service Marketplace.
-- Run this in the Supabase SQL editor (SQL > New query > paste > Run).
-- Off-chain records; the chain holds escrow + proof. Safe to re-run (idempotent).

-- ── Workers ────────────────────────────────────────────────
create table if not exists workers (
  id        text primary key,
  name      text not null,
  role      text,
  emoji     text,
  skills    text[] not null default '{}',
  rating    numeric default 5,
  jobs_done int default 0,
  available boolean default true,
  location  text,
  tagline   text,
  wallet    text not null
);

-- ── Jobs ───────────────────────────────────────────────────
-- We store the full job record (parsed job, matched worker snapshot, and the
-- ordered steps array) so the DB shape mirrors the app's job object 1:1 and the
-- dashboard can render straight from a single row.
create table if not exists jobs (
  uuid         uuid primary key,
  request_text text not null,
  parsed       jsonb,                 -- {category,urgency,location,estimatedBudgetSTT,summary}
  worker       jsonb,                 -- snapshot of the matched worker (display fields)
  estimated    numeric,               -- LLM's fair-price estimate (STT)
  amount       numeric,               -- actually-locked escrow (STT)
  status       text default 'created',-- created | escrow_locked | paid | refunded
  steps        jsonb not null default '[]'::jsonb, -- [{step, payload}]
  seq          bigint generated always as identity, -- newest-first ordering
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists jobs_seq_idx on jobs (seq desc);

-- ── Agent logs ─────────────────────────────────────────────
-- Every autonomous decision + tx, as a flat audit trail.
create table if not exists agent_logs (
  id         bigint generated always as identity primary key,
  job_uuid   text,
  step       text,
  payload    jsonb,
  created_at timestamptz default now()
);

create index if not exists agent_logs_job_idx on agent_logs (job_uuid);

-- ── Seed the demo worker pool (matches app/workers.js) ─────
insert into workers (id, name, role, emoji, skills, rating, jobs_done, available, location, tagline, wallet) values
  ('w1', 'Ali Raza',     'Plumber',     '🔧', '{plumbing,general}',  4.8, 127, true, 'Lahore',  'Leak-free guarantee. Same-day callouts.',        '0x000000000000000000000000000000000000dEaD'),
  ('w2', 'Sara Khan',    'Electrician', '⚡', '{electrical,tech}',   4.6,  98, true, 'Lahore',  'Certified wiring & smart-home installs.',        '0x000000000000000000000000000000000000bEEF'),
  ('w3', 'Hassan Iqbal', 'Cleaner',     '🧹', '{cleaning,delivery}', 4.9, 211, true, 'Karachi', 'Deep cleans & reliable doorstep delivery.',      '0x000000000000000000000000000000000000CAFE')
on conflict (id) do nothing;

-- ── Row Level Security ─────────────────────────────────────
-- The app talks to Supabase with the SERVICE ROLE key (server-side only),
-- which bypasses RLS. We enable RLS so nothing is exposed if the anon key
-- is ever used from the browser. No anon policies = anon can't read/write.
alter table workers    enable row level security;
alter table jobs       enable row level security;
alter table agent_logs enable row level security;

-- Allow the public marketplace to read workers via the anon key (read-only).
drop policy if exists "workers public read" on workers;
create policy "workers public read" on workers for select using (true);
