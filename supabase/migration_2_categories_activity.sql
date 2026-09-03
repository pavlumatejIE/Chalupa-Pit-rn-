-- ============================================================
-- Chalupa Pitárné – rozšíření schématu (kategorie + log aktivit)
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

-- Kategorie dokumentů
create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists category_id uuid references public.document_categories(id) on delete set null;

-- Log aktivit (poslední události pod kalendářem)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

-- RLS
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
