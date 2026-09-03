-- ============================================================
-- Chalupa Pitárné – sekce "Co je potřeba" (práce a nákupy)
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('prace', 'nakup')),
  popis text not null,
  termin date,
  prirazeno uuid references public.profiles(id) on delete set null,
  cena numeric,
  jednotka text check (jednotka in ('czk', 'hours', 'persondays')),
  zadal uuid references public.profiles(id) on delete set null,
  hotovo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (public.is_approved());

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks
  for insert with check (auth.uid() = zadal and public.is_approved());

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks
  for update using (auth.uid() = zadal or auth.uid() = prirazeno or public.is_admin());

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (auth.uid() = zadal or public.is_admin());
