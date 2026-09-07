-- ============================================================
-- Chalupa Pitárné – odznaky s počtem novinek u jednotlivých sekcí
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

create table if not exists public.last_seen (
  user_id uuid not null references public.profiles(id) on delete cascade,
  section text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, section)
);

alter table public.last_seen enable row level security;

drop policy if exists "last_seen_select_own" on public.last_seen;
create policy "last_seen_select_own" on public.last_seen
  for select using (auth.uid() = user_id);

drop policy if exists "last_seen_insert_own" on public.last_seen;
create policy "last_seen_insert_own" on public.last_seen
  for insert with check (auth.uid() = user_id);

drop policy if exists "last_seen_update_own" on public.last_seen;
create policy "last_seen_update_own" on public.last_seen
  for update using (auth.uid() = user_id);
