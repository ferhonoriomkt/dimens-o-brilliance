
-- Enum de roles
create type public.app_role as enum ('admin', 'client');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role (security definer to avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  location text,
  category text,
  year int,
  cover_image_url text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create trigger projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- project_images
create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.project_images enable row level security;

-- ===== RLS policies =====

-- profiles
create policy "Profiles: self select"
on public.profiles for select to authenticated
using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

create policy "Profiles: self update"
on public.profiles for update to authenticated
using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "Roles: self read"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Roles: admin manage"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- projects: public can read published; admins do everything
create policy "Projects: public read published"
on public.projects for select
using (published = true);

create policy "Projects: admin read all"
on public.projects for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Projects: admin insert"
on public.projects for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Projects: admin update"
on public.projects for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Projects: admin delete"
on public.projects for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- project_images
create policy "Images: public read for published"
on public.project_images for select
using (exists (select 1 from public.projects p where p.id = project_id and p.published = true));

create policy "Images: admin read all"
on public.project_images for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Images: admin insert"
on public.project_images for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Images: admin update"
on public.project_images for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Images: admin delete"
on public.project_images for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ===== Storage =====
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "Portfolio: public read"
on storage.objects for select
using (bucket_id = 'portfolio');

create policy "Portfolio: admin insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio' and public.has_role(auth.uid(), 'admin'));

create policy "Portfolio: admin update"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio' and public.has_role(auth.uid(), 'admin'));

create policy "Portfolio: admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio' and public.has_role(auth.uid(), 'admin'));
