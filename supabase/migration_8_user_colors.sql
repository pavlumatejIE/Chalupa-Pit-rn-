-- ============================================================
-- Chalupa Pitárné – barevné rozlišení uživatelů + jméno z e-mailu
-- Spusť v Supabase SQL Editoru. Je bezpečné spustit i podruhé.
-- ============================================================

-- Nová registrace dostane náhodnou barvu z palety a jako jméno
-- e-mail (před zavináčem), pokud nezadá celé jméno.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  palette text[] := array['#A8442D','#4B5D3A','#8F6B2E','#5E6E8F','#6B4A34','#7C4B6B','#2E7D6B','#B5651D'];
  chosen_color text;
begin
  chosen_color := palette[1 + floor(random() * array_length(palette, 1))::int];
  insert into public.profiles (id, full_name, email, color)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    chosen_color
  );
  return new;
end;
$$ language plpgsql security definer;

-- Stávajícím uživatelům (kteří mají všichni stejnou tmavě zelenou)
-- rozdělí barvy z palety postupně podle data registrace, ať má
-- každý jinou.
with numbered as (
  select id, row_number() over (order by created_at) as rn
  from public.profiles
)
update public.profiles p
set color = (array['#A8442D','#4B5D3A','#8F6B2E','#5E6E8F','#6B4A34','#7C4B6B','#2E7D6B','#B5651D'])[((n.rn - 1) % 8) + 1]
from numbered n
where p.id = n.id;

-- Uživatelům bez vyplněného jména (kdyby nějací byli) doplní jméno
-- z e-mailu.
update public.profiles
set full_name = split_part(email, '@', 1)
where full_name is null or trim(full_name) = '';
