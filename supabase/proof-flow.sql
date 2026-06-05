-- ServiceChain — Proof-of-Work flow: worker evidence -> client approval.
-- Run in the Supabase SQL editor. Idempotent.

-- ── jobs: proof + decision columns ────────────────────────────────
alter table jobs
  add column if not exists proof_text         text,
  add column if not exists proof_photo_url    text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists ai_check           jsonb,       -- vision advisory {looksConsistent,confidence,notes}
  add column if not exists client_decision    text,        -- 'approved' | 'disputed'
  add column if not exists client_decided_at  timestamptz;

-- ── Storage bucket for proof photos ───────────────────────────────
-- Public-read so the client + dashboard can show the image by URL.
insert into storage.buckets (id, name, public)
values ('job-proofs', 'job-proofs', true)
on conflict (id) do update set public = true;

-- Anyone can READ proof images (they're public job evidence, no secrets).
drop policy if exists "job-proofs public read" on storage.objects;
create policy "job-proofs public read" on storage.objects
  for select using (bucket_id = 'job-proofs');

-- Only authenticated users may upload (the app uploads via service role, which
-- bypasses this anyway; this allows an authenticated client-side upload too).
drop policy if exists "job-proofs auth write" on storage.objects;
create policy "job-proofs auth write" on storage.objects
  for insert to authenticated with check (bucket_id = 'job-proofs');
