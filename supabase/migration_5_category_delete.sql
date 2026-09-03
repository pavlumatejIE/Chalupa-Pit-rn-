-- ============================================================
-- Chalupa Pitárné – mazání kategorií dokumentů (jen administrátor)
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

drop policy if exists "categories_delete" on public.document_categories;
create policy "categories_delete" on public.document_categories
  for delete using (public.is_admin());
