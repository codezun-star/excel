-- =============================================================================
-- Excel Codezun — 001: esquema base (Fase 1)
-- Ejecutar en el SQL Editor de Supabase (una sola vez, en orden numérico).
-- Crea: profiles, saved_configs, downloads, RLS, permisos y trigger de perfiles.
-- Es idempotente: se puede volver a ejecutar sin duplicar objetos.
-- =============================================================================

-- Tipo de plan del perfil (en la Fase 2 la fuente de verdad pasa a entitlements)
do $$ begin
  create type public.plan_tier as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

-- Función genérica para mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: un registro por usuario de auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 120),
  country     text not null default 'HN' check (country ~ '^[A-Z]{2}$'),
  plan        public.plan_tier not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- saved_configs: configuraciones guardadas para reutilizar
-- -----------------------------------------------------------------------------
create table if not exists public.saved_configs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_slug  text not null check (template_slug ~ '^[a-z0-9-]{2,80}$'),
  name           text not null check (char_length(name) between 1 and 120),
  country        text not null default 'HN' check (country ~ '^[A-Z]{2}$'),
  config         jsonb not null default '{}'::jsonb check (pg_column_size(config) < 1000000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists saved_configs_user_idx on public.saved_configs (user_id, updated_at desc);
create index if not exists saved_configs_template_idx on public.saved_configs (user_id, template_slug);

drop trigger if exists saved_configs_updated_at on public.saved_configs;
create trigger saved_configs_updated_at before update on public.saved_configs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- downloads: historial de descargas (anónimas o de usuarios)
-- -----------------------------------------------------------------------------
create table if not exists public.downloads (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users (id) on delete set null,
  template_slug  text not null check (template_slug ~ '^[a-z0-9-]{2,80}$'),
  country        text not null check (country ~ '^[A-Z]{2}$'),
  created_at     timestamptz not null default now()
);

create index if not exists downloads_user_idx on public.downloads (user_id, created_at desc);
create index if not exists downloads_template_idx on public.downloads (template_slug, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS: cada usuario solo ve y modifica lo suyo
-- -----------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.saved_configs enable row level security;
alter table public.downloads     enable row level security;

drop policy if exists "profiles: ver el propio" on public.profiles;
create policy "profiles: ver el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: editar el propio" on public.profiles;
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "saved_configs: ver las propias" on public.saved_configs;
create policy "saved_configs: ver las propias" on public.saved_configs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "saved_configs: crear propias" on public.saved_configs;
create policy "saved_configs: crear propias" on public.saved_configs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "saved_configs: editar propias" on public.saved_configs;
create policy "saved_configs: editar propias" on public.saved_configs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "saved_configs: borrar propias" on public.saved_configs;
create policy "saved_configs: borrar propias" on public.saved_configs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- downloads: cualquiera puede insertar (anónimos con user_id nulo), solo se lee lo propio
drop policy if exists "downloads: insertar" on public.downloads;
create policy "downloads: insertar" on public.downloads
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "downloads: ver las propias" on public.downloads;
create policy "downloads: ver las propias" on public.downloads
  for select to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Permisos por columna: el usuario NO puede cambiarse el plan a sí mismo
-- -----------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, country) on public.profiles to authenticated;

revoke all on public.saved_configs from anon;
grant select, insert, update, delete on public.saved_configs to authenticated;

revoke all on public.downloads from anon, authenticated;
grant insert on public.downloads to anon, authenticated;
grant select on public.downloads to authenticated;

-- -----------------------------------------------------------------------------
-- Trigger: crea el perfil al registrarse
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_country text := upper(coalesce(new.raw_user_meta_data ->> 'country', 'HN'));
begin
  if v_country !~ '^[A-Z]{2}$' then
    v_country := 'HN';
  end if;
  insert into public.profiles (id, full_name, country)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    v_country
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
