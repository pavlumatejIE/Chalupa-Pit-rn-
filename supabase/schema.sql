-- ============================================================
-- Chalupa Pitárné – databázové schéma pro Supabase
-- Spusť celé v Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  color text not null default '#4B5D3A',
  created_at timestamptz not null default now()
);

-- automaticky založí profil (status "pending") při registraci
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RESERVATIONS ----------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_from date not null,
  date_to date not null,
  hour_from time,
  hour_to time,
  note text,
  created_at timestamptz not null default now(),
  check (date_to >= date_from)
);

-- ---------- MESSAGES (nástěnka) ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);

-- ---------- DOCUMENTS ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  title text not null,
  file_url text not null,
  visible_to text not null default 'all' check (visible_to in ('all','admins')),
  created_at timestamptz not null default now()
);

-- ---------- PAYMENTS (zatím jen kostra) ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.payments enable row level security;

-- helper: je aktuální uživatel schválený admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$ language sql stable security definer;

-- helper: je aktuální uživatel schválený?
create or replace function public.is_approved()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$ language sql stable security definer;

-- ---------- profiles policies ----------
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_approved());

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_manage" on public.profiles
  for all using (public.is_admin());

-- ---------- reservations policies ----------
create policy "reservations_select" on public.reservations
  for select using (public.is_approved());

create policy "reservations_insert" on public.reservations
  for insert with check (auth.uid() = user_id and public.is_approved());

create policy "reservations_delete_own" on public.reservations
  for delete using (auth.uid() = user_id or public.is_admin());

create policy "reservations_update_own" on public.reservations
  for update using (auth.uid() = user_id or public.is_admin());

-- ---------- messages policies ----------
create policy "messages_select" on public.messages
  for select using (public.is_approved());

create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = user_id and public.is_approved());

create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------- documents policies ----------
create policy "documents_select" on public.documents
  for select using (
    public.is_approved()
    and (visible_to = 'all' or uploaded_by = auth.uid() or public.is_admin())
  );

create policy "documents_insert" on public.documents
  for insert with check (public.is_approved());

create policy "documents_delete_own" on public.documents
  for delete using (uploaded_by = auth.uid() or public.is_admin());

-- ---------- payments policies ----------
create policy "payments_select" on public.payments
  for select using (public.is_approved());

create policy "payments_insert" on public.payments
  for insert with check (public.is_approved());

-- ---------- DOCUMENT CATEGORIES ----------
create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.documents
  add column category_id uuid references public.document_categories(id) on delete set null;

-- ---------- ACTIVITY LOG (poslední události) ----------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.document_categories enable row level security;
alter table public.activity_log enable row level security;

create policy "categories_select" on public.document_categories
  for select using (public.is_approved());
create policy "categories_insert" on public.document_categories
  for insert with check (public.is_approved());

create policy "activity_select" on public.activity_log
  for select using (public.is_approved());
create policy "activity_insert" on public.activity_log
  for insert with check (public.is_approved());

-- ---------- HLASOVÁNÍ ----------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  question text not null,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.poll_votes (
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

create policy "polls_select" on public.polls for select using (public.is_approved());
create policy "polls_insert" on public.polls for insert with check (auth.uid() = created_by and public.is_approved());

create policy "poll_options_select" on public.poll_options for select using (public.is_approved());
create policy "poll_options_insert" on public.poll_options for insert with check (public.is_approved());

create policy "poll_votes_select" on public.poll_votes for select using (public.is_approved());
create policy "poll_votes_insert" on public.poll_votes for insert with check (auth.uid() = user_id and public.is_approved());
create policy "poll_votes_update" on public.poll_votes for update using (auth.uid() = user_id);

-- ---------- FOTKY ----------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;
create policy "photos_select" on public.photos for select using (public.is_approved());
create policy "photos_insert" on public.photos for insert with check (public.is_approved());

-- ============================================================
-- STORAGE (soubory a fotky)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "documents_bucket_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents');

create policy "documents_bucket_read" on storage.objects
  for select using (bucket_id = 'documents');

create policy "attachments_bucket_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments');

create policy "attachments_bucket_read" on storage.objects
  for select using (bucket_id = 'attachments');

create policy "photos_bucket_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos');

create policy "photos_bucket_read" on storage.objects
  for select using (bucket_id = 'photos');

-- ============================================================
-- PRVNÍ ADMIN
-- Po registraci prvního účtu spusť ručně (nahraď e-mail):
--
-- update public.profiles
-- set role = 'admin', status = 'approved'
-- where email = 'tvuj@email.cz';
-- ============================================================
