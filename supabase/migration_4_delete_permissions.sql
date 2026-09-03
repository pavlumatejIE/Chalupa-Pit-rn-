-- ============================================================
-- Chalupa Pitárné – oprávnění k mazání (hlasování + fotky)
-- Zprávy, dokumenty a rezervace už mazací oprávnění mají
-- (vlastník nebo administrátor) – tahle migrace doplňuje zbytek.
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

drop policy if exists "polls_delete" on public.polls;
create policy "polls_delete" on public.polls
  for delete using (created_by = auth.uid() or public.is_admin());

drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete" on public.photos
  for delete using (uploaded_by = auth.uid() or public.is_admin());
