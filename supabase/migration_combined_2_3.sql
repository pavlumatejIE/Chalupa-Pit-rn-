-- ============================================================
-- Chalupa Pitárné – kombinovaná migrace
-- (kategorie dokumentů + log aktivit + hlasování + fotky)
-- Spusť celé najednou v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

-- ---------- KATEGORIE DOKUMENTŮ ----------
create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists category_id uuid references public.document_categories(id) on delete set null;

-- ---------- LOG AKTIVIT (poslední události) ----------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.document_categories enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "categories_select" on public.document_categories;
create policy "categories_select" on public.document_categories
  for select using (public.is_approved());

drop policy if exists "categories_insert" on public.document_categories;
create policy "categories_insert" on public.document_categories
  for insert with check (public.is_approved());

drop policy if exists "activity_select" on public.activity_log;
create policy "activity_select" on public.activity_log
  for select using (public.is_approved());

drop policy if exists "activity_insert" on public.activity_log;
create policy "activity_insert" on public.activity_log
  for insert with check (public.is_approved());

-- ---------- HLASOVÁNÍ ----------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  question text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "polls_select" on public.polls;
create policy "polls_select" on public.polls for select using (public.is_approved());
drop policy if exists "polls_insert" on public.polls;
create policy "polls_insert" on public.polls for insert with check (auth.uid() = created_by and public.is_approved());

drop policy if exists "poll_options_select" on public.poll_options;
create policy "poll_options_select" on public.poll_options for select using (public.is_approved());
drop policy if exists "poll_options_insert" on public.poll_options;
create policy "poll_options_insert" on public.poll_options for insert with check (public.is_approved());

drop policy if exists "poll_votes_select" on public.poll_votes;
create policy "poll_votes_select" on public.poll_votes for select using (public.is_approved());
drop policy if exists "poll_votes_insert" on public.poll_votes;
create policy "poll_votes_insert" on public.poll_votes for insert with check (auth.uid() = user_id and public.is_approved());
drop policy if exists "poll_votes_update" on public.poll_votes;
create policy "poll_votes_update" on public.poll_votes for update using (auth.uid() = user_id);

-- ---------- FOTKY ----------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

drop policy if exists "photos_select" on public.photos;
create policy "photos_select" on public.photos for select using (public.is_approved());
drop policy if exists "photos_insert" on public.photos;
create policy "photos_insert" on public.photos for insert with check (public.is_approved());

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_bucket_upload" on storage.objects;
create policy "photos_bucket_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "photos_bucket_read" on storage.objects;
create policy "photos_bucket_read" on storage.objects
  for select using (bucket_id = 'photos');
