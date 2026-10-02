-- =============================================================================
-- Excel Codezun — 002: monetización (Fase 2)
-- Planes, suscripciones, compras únicas, entitlements, uso mensual, perfiles
-- de cliente, cupones, eventos de pago (idempotencia), pagos manuales,
-- analítica y rol de administrador.
--
-- Regla de oro: el cliente NUNCA puede otorgarse un plan. Las tablas de
-- pagos y accesos solo las escribe el rol de servicio (servidor) o un admin.
-- Idempotente: se puede ejecutar más de una vez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rol de administrador en profiles
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists role public.app_role not null default 'user';
-- El permiso de UPDATE sigue limitado a (full_name, country): el usuario no puede cambiar su rol.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- plans: precios, límites y beneficios (editables sin tocar código)
-- -----------------------------------------------------------------------------
create table if not exists public.plans (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name               text not null,
  description        text,
  price_monthly_usd  numeric(10, 2) check (price_monthly_usd is null or price_monthly_usd >= 0),
  price_yearly_usd   numeric(10, 2) check (price_yearly_usd is null or price_yearly_usd >= 0),
  price_once_usd     numeric(10, 2) check (price_once_usd is null or price_once_usd >= 0),
  limits             jsonb not null default '{}'::jsonb,
  features           jsonb not null default '[]'::jsonb,
  highlight          boolean not null default false,
  active             boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- subscriptions
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'pending');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users (id) on delete cascade,
  plan_code                 text not null references public.plans (code) on update cascade,
  billing_cycle             text check (billing_cycle in ('monthly', 'yearly')),
  status                    public.subscription_status not null default 'pending',
  provider                  text not null check (provider in ('paddle', 'paypal', 'tilopay', 'manual', 'coupon', 'admin')),
  provider_subscription_id  text,
  provider_customer_id      text,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id, created_at desc);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- purchases: compras únicas de plantillas Pro
-- -----------------------------------------------------------------------------
create table if not exists public.purchases (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users (id) on delete set null,
  email                text,
  template_slug        text not null check (template_slug ~ '^[a-z0-9-]{2,80}$'),
  amount               numeric(10, 2) not null check (amount >= 0),
  currency             text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  provider             text not null check (provider in ('paddle', 'paypal', 'tilopay', 'manual', 'coupon', 'admin')),
  provider_payment_id  text,
  status               text not null default 'completed' check (status in ('pending', 'completed', 'refunded', 'failed')),
  created_at           timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- entitlements: la tabla que consulta TODO el código para saber qué puede hacer alguien
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.entitlement_kind as enum ('plan', 'template');
exception when duplicate_object then null; end $$;

create table if not exists public.entitlements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         public.entitlement_kind not null,
  ref          text not null check (ref ~ '^[a-z0-9-]{2,80}$'),
  valid_until  timestamptz, -- null = sin vencimiento
  source       text not null unique, -- subscription:<id> | purchase:<id> | coupon:<code>:<user> | admin:<…>
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists entitlements_user_idx on public.entitlements (user_id, kind, valid_until);

drop trigger if exists entitlements_updated_at on public.entitlements;
create trigger entitlements_updated_at before update on public.entitlements
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- usage_counters: descargas por mes de cuentas (user_id) o anónimos (anon_id)
-- -----------------------------------------------------------------------------
create table if not exists public.usage_counters (
  id               bigint generated always as identity primary key,
  user_id          uuid references auth.users (id) on delete cascade,
  anon_id          text check (anon_id is null or anon_id ~ '^[A-Za-z0-9_-]{16,64}$'),
  month            date not null,
  downloads_count  integer not null default 0 check (downloads_count >= 0),
  updated_at       timestamptz not null default now(),
  check ((user_id is null) <> (anon_id is null))
);
create unique index if not exists usage_counters_user_month on public.usage_counters (user_id, month) where user_id is not null;
create unique index if not exists usage_counters_anon_month on public.usage_counters (anon_id, month) where anon_id is not null;

-- -----------------------------------------------------------------------------
-- client_profiles: perfiles de cliente o empresa (plan Negocio)
-- -----------------------------------------------------------------------------
create table if not exists public.client_profiles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  rtn         text check (rtn is null or char_length(rtn) <= 25),
  address     text check (address is null or char_length(address) <= 200),
  phone       text check (phone is null or char_length(phone) <= 40),
  email       text check (email is null or char_length(email) <= 120),
  -- Logo como data URL (PNG/JPEG ya reducido en el navegador, máx. ~500 KB)
  logo        text check (logo is null or (logo like 'data:image/%' and char_length(logo) < 700000)),
  -- Marca propia: {"color": "#217346", "footer": "Texto al pie"}
  branding    jsonb not null default '{}'::jsonb check (pg_column_size(branding) < 10000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists client_profiles_owner_idx on public.client_profiles (owner_id, name);

drop trigger if exists client_profiles_updated_at on public.client_profiles;
create trigger client_profiles_updated_at before update on public.client_profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- saved_configs: versión de reglas y perfil de cliente
-- -----------------------------------------------------------------------------
alter table public.saved_configs add column if not exists rules_version text;
alter table public.saved_configs add column if not exists client_profile_id uuid references public.client_profiles (id) on delete set null;

-- -----------------------------------------------------------------------------
-- downloads: ahora las registra solo el servidor (respeta límites)
-- -----------------------------------------------------------------------------
alter table public.downloads add column if not exists anon_id text;
alter table public.downloads add column if not exists source text not null default 'browser'
  check (source in ('browser', 'server', 'batch'));

-- -----------------------------------------------------------------------------
-- coupons y coupon_redemptions
-- -----------------------------------------------------------------------------
create table if not exists public.coupons (
  code             text primary key check (code ~ '^[A-Z0-9_-]{3,40}$'),
  percent_off      integer not null check (percent_off between 1 and 100),
  max_redemptions  integer check (max_redemptions is null or max_redemptions > 0),
  times_redeemed   integer not null default 0 check (times_redeemed >= 0),
  expires_at       timestamptz,
  applies_to       text[] not null default '{}', -- códigos de plan o 'compra-unica'; vacío = todos
  duration_months  integer not null default 1 check (duration_months between 1 and 36),
  provider_codes   jsonb not null default '{}'::jsonb, -- {"paddle": "dsc_..."}
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_code  text not null references public.coupons (code) on update cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  context      text not null,
  created_at   timestamptz not null default now(),
  unique (coupon_code, user_id)
);

-- -----------------------------------------------------------------------------
-- payment_events: registro de webhooks para idempotencia y auditoría
-- -----------------------------------------------------------------------------
create table if not exists public.payment_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,
  event_type    text not null,
  payload       jsonb not null,
  result        text,
  processed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (provider, event_id)
);

-- -----------------------------------------------------------------------------
-- manual_payments: transferencias y depósitos con comprobante
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.manual_payment_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.manual_payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  kind              text not null check (kind in ('plan', 'template')),
  plan_code         text references public.plans (code) on update cascade,
  billing_cycle     text check (billing_cycle in ('monthly', 'yearly')),
  template_slug     text check (template_slug is null or template_slug ~ '^[a-z0-9-]{2,80}$'),
  amount            numeric(10, 2) not null check (amount >= 0),
  currency          text not null default 'USD',
  amount_local      numeric(12, 2),
  local_currency    text,
  reference         text not null unique check (reference ~ '^[A-Z0-9-]{6,40}$'),
  coupon_code       text,
  proof_url         text,
  status            public.manual_payment_status not null default 'pending',
  notes             text,
  rejection_reason  text,
  reviewed_by       uuid references auth.users (id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (
    (kind = 'plan' and plan_code is not null and billing_cycle is not null)
    or (kind = 'template' and template_slug is not null)
  )
);
create index if not exists manual_payments_status_idx on public.manual_payments (status, created_at);
create index if not exists manual_payments_user_idx on public.manual_payments (user_id, created_at desc);

drop trigger if exists manual_payments_updated_at on public.manual_payments;
create trigger manual_payments_updated_at before update on public.manual_payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- events: analítica de negocio propia (sin servicios externos)
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id             bigint generated always as identity primary key,
  name           text not null check (name in ('paywall_view', 'checkout_start', 'payment_completed', 'download', 'upgrade_click', 'signup')),
  user_id        uuid references auth.users (id) on delete set null,
  anon_id        text,
  template_slug  text,
  props          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists events_name_idx on public.events (name, created_at desc);
create index if not exists events_template_idx on public.events (template_slug, name);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.plans              enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.purchases          enable row level security;
alter table public.entitlements       enable row level security;
alter table public.usage_counters     enable row level security;
alter table public.client_profiles    enable row level security;
alter table public.coupons            enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.payment_events     enable row level security;
alter table public.manual_payments    enable row level security;
alter table public.events             enable row level security;

-- plans: lectura pública de los activos; escritura solo admin
drop policy if exists "plans: leer activos" on public.plans;
create policy "plans: leer activos" on public.plans for select to anon, authenticated
  using (active or (select public.is_admin()));
drop policy if exists "plans: admin escribe" on public.plans;
create policy "plans: admin escribe" on public.plans for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Tablas de lectura propia + escritura solo admin
do $$
declare
  t text;
begin
  foreach t in array array['subscriptions', 'purchases', 'entitlements', 'manual_payments', 'coupon_redemptions'] loop
    execute format('drop policy if exists "%1$s: ver propias" on public.%1$I', t);
    execute format('create policy "%1$s: ver propias" on public.%1$I for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()))', t);
    execute format('drop policy if exists "%1$s: admin escribe" on public.%1$I', t);
    execute format('create policy "%1$s: admin escribe" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

-- usage_counters: cada quien ve su contador; se escribe con increment_download_usage
drop policy if exists "usage_counters: ver propio" on public.usage_counters;
create policy "usage_counters: ver propio" on public.usage_counters for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- client_profiles: el dueño los ve y los borra; crear y editar pasa por el servidor (límite del plan)
drop policy if exists "client_profiles: ver propios" on public.client_profiles;
create policy "client_profiles: ver propios" on public.client_profiles for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "client_profiles: borrar propios" on public.client_profiles;
create policy "client_profiles: borrar propios" on public.client_profiles for delete to authenticated
  using (owner_id = (select auth.uid()));

-- coupons, payment_events y events: solo admin (el servidor usa el rol de servicio)
drop policy if exists "coupons: admin" on public.coupons;
create policy "coupons: admin" on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "payment_events: admin lee" on public.payment_events;
create policy "payment_events: admin lee" on public.payment_events for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "events: admin lee" on public.events;
create policy "events: admin lee" on public.events for select to authenticated
  using ((select public.is_admin()));

-- profiles: los admins pueden ver todos los perfiles
drop policy if exists "profiles: admin lee todo" on public.profiles;
create policy "profiles: admin lee todo" on public.profiles for select to authenticated
  using ((select public.is_admin()));

-- saved_configs: crear y editar ahora pasa por el servidor (requiere plan con «guardar configuraciones»)
drop policy if exists "saved_configs: crear propias" on public.saved_configs;
drop policy if exists "saved_configs: editar propias" on public.saved_configs;
revoke insert, update on public.saved_configs from authenticated;

-- downloads: solo el servidor registra descargas (para que los límites no se puedan saltar)
drop policy if exists "downloads: insertar" on public.downloads;
revoke insert on public.downloads from anon, authenticated;
drop policy if exists "downloads: admin lee" on public.downloads;
create policy "downloads: admin lee" on public.downloads for select to authenticated
  using ((select public.is_admin()));

-- =============================================================================
-- Permisos de tabla (RLS filtra filas; sin GRANT no hay acceso)
-- =============================================================================
revoke all on public.plans, public.subscriptions, public.purchases, public.entitlements,
  public.usage_counters, public.client_profiles, public.coupons, public.coupon_redemptions,
  public.payment_events, public.manual_payments, public.events from anon, authenticated;

grant select on public.plans to anon, authenticated;
grant insert, update, delete on public.plans to authenticated; -- RLS: solo admin
grant select on public.subscriptions, public.purchases, public.entitlements, public.manual_payments,
  public.coupon_redemptions, public.usage_counters, public.client_profiles to authenticated;
grant insert, update, delete on public.subscriptions, public.purchases, public.entitlements,
  public.manual_payments, public.coupon_redemptions to authenticated; -- RLS: solo admin
grant delete on public.client_profiles to authenticated;
grant select, insert, update, delete on public.coupons to authenticated; -- RLS: solo admin
grant select on public.payment_events, public.events to authenticated; -- RLS: solo admin

-- =============================================================================
-- Funciones (SECURITY DEFINER, solo para el rol de servicio)
-- =============================================================================

-- Cuenta una descarga si no supera el límite del mes. Atómica (sin carreras).
create or replace function public.increment_download_usage(p_user_id uuid, p_anon_id text, p_limit integer)
returns table (allowed boolean, used integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_count integer;
begin
  if (p_user_id is null) = (p_anon_id is null) then
    raise exception 'Se requiere user_id o anon_id (solo uno)';
  end if;

  if p_limit is not null and p_limit <= 0 then
    select coalesce(max(downloads_count), 0) into v_count from public.usage_counters
      where month = v_month and (user_id = p_user_id or anon_id = p_anon_id);
    return query select false, v_count, 0;
    return;
  end if;

  if p_user_id is not null then
    insert into public.usage_counters as u (user_id, month, downloads_count)
    values (p_user_id, v_month, 1)
    on conflict (user_id, month) where user_id is not null
    do update set downloads_count = u.downloads_count + 1, updated_at = now()
      where p_limit is null or u.downloads_count < p_limit
    returning u.downloads_count into v_count;
  else
    insert into public.usage_counters as u (anon_id, month, downloads_count)
    values (p_anon_id, v_month, 1)
    on conflict (anon_id, month) where anon_id is not null
    do update set downloads_count = u.downloads_count + 1, updated_at = now()
      where p_limit is null or u.downloads_count < p_limit
    returning u.downloads_count into v_count;
  end if;

  if v_count is null then
    -- Se alcanzó el límite: no se actualizó ninguna fila
    select downloads_count into v_count from public.usage_counters
      where month = v_month and (user_id = p_user_id or anon_id = p_anon_id);
    return query select false, coalesce(v_count, 0), 0;
  else
    return query select true, v_count, case when p_limit is null then null else greatest(p_limit - v_count, 0) end;
  end if;
end;
$$;

-- Descargas usadas en el mes actual
create or replace function public.get_download_usage(p_user_id uuid, p_anon_id text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(downloads_count), 0) from public.usage_counters
  where month = date_trunc('month', now())::date
    and ((p_user_id is not null and user_id = p_user_id) or (p_anon_id is not null and anon_id = p_anon_id));
$$;

-- Canjea un cupón para un usuario (una vez por usuario, respeta máximo y vencimiento)
create or replace function public.redeem_coupon(p_code text, p_user_id uuid, p_context text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons%rowtype;
begin
  select * into v_coupon from public.coupons where code = upper(p_code) for update;
  if not found or not v_coupon.active then return false; end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then return false; end if;
  if v_coupon.max_redemptions is not null and v_coupon.times_redeemed >= v_coupon.max_redemptions then return false; end if;
  insert into public.coupon_redemptions (coupon_code, user_id, context)
  values (v_coupon.code, p_user_id, p_context)
  on conflict (coupon_code, user_id) do nothing;
  if not found then return false; end if;
  update public.coupons set times_redeemed = times_redeemed + 1 where code = v_coupon.code;
  return true;
end;
$$;

-- Cupón del 100 %: canjea y otorga el plan por la duración del cupón, en una transacción
create or replace function public.grant_coupon_access(p_code text, p_user_id uuid, p_plan_code text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons%rowtype;
  v_until timestamptz;
begin
  select * into v_coupon from public.coupons where code = upper(p_code);
  if not found or v_coupon.percent_off < 100 then
    raise exception 'El cupón no otorga acceso gratuito';
  end if;
  if cardinality(v_coupon.applies_to) > 0 and not (p_plan_code = any (v_coupon.applies_to)) then
    raise exception 'El cupón no aplica a este plan';
  end if;
  if not public.redeem_coupon(p_code, p_user_id, 'free:' || p_plan_code) then
    raise exception 'El cupón no es válido o ya fue usado';
  end if;
  v_until := now() + make_interval(months => v_coupon.duration_months);
  insert into public.entitlements (user_id, kind, ref, valid_until, source)
  values (p_user_id, 'plan', p_plan_code, v_until, 'coupon:' || v_coupon.code || ':' || p_user_id)
  on conflict (source) do nothing;
  return v_until;
end;
$$;

-- Procesa un evento de pago normalizado de forma idempotente y atómica.
-- Devuelve 'processed', 'duplicate' o 'ignored'.
create or replace function public.process_payment_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_event jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_row uuid;
  v_type text := p_event ->> 'type';
  v_user uuid := nullif(p_event ->> 'userId', '')::uuid;
  v_email text := nullif(p_event ->> 'email', '');
  v_plan text := nullif(p_event ->> 'planCode', '');
  v_cycle text := nullif(p_event ->> 'cycle', '');
  v_sub_id text := nullif(p_event ->> 'providerSubscriptionId', '');
  v_period_end timestamptz := nullif(p_event ->> 'currentPeriodEnd', '')::timestamptz;
  v_effective timestamptz := coalesce(nullif(p_event ->> 'effectiveAt', '')::timestamptz, now());
  v_subscription public.subscriptions%rowtype;
  v_purchase_id uuid;
  v_access_days integer := coalesce(nullif(p_event ->> 'accessDays', '')::integer, 7);
  v_result text := 'processed';
begin
  insert into public.payment_events (provider, event_id, event_type, payload)
  values (p_provider, p_event_id, p_event_type, p_payload)
  on conflict (provider, event_id) do nothing
  returning id into v_event_row;

  if v_event_row is null then
    return 'duplicate';
  end if;

  -- Si no llegó el usuario pero sí el correo, se intenta asociar
  if v_user is null and v_email is not null then
    select id into v_user from auth.users where lower(email) = lower(v_email) limit 1;
  end if;

  if v_type in ('subscription.activated', 'subscription.renewed', 'subscription.updated') then
    if v_user is null or v_plan is null or v_sub_id is null then
      raise exception 'Evento de suscripción incompleto (usuario, plan o id)';
    end if;
    insert into public.subscriptions as s (user_id, plan_code, billing_cycle, status, provider, provider_subscription_id,
      provider_customer_id, current_period_end, cancel_at_period_end)
    values (v_user, v_plan, v_cycle, 'active', p_provider, v_sub_id, nullif(p_event ->> 'providerCustomerId', ''),
      v_period_end, coalesce((p_event ->> 'cancelAtPeriodEnd')::boolean, false))
    on conflict (provider, provider_subscription_id) do update set
      plan_code = excluded.plan_code,
      billing_cycle = coalesce(excluded.billing_cycle, s.billing_cycle),
      status = 'active',
      provider_customer_id = coalesce(excluded.provider_customer_id, s.provider_customer_id),
      current_period_end = coalesce(excluded.current_period_end, s.current_period_end),
      cancel_at_period_end = excluded.cancel_at_period_end
    returning * into v_subscription;

    insert into public.entitlements as e (user_id, kind, ref, valid_until, source)
    values (v_subscription.user_id, 'plan', v_subscription.plan_code, v_subscription.current_period_end,
      'subscription:' || v_subscription.id)
    on conflict (source) do update set ref = excluded.ref, valid_until = excluded.valid_until;

  elsif v_type = 'subscription.past_due' then
    update public.subscriptions set status = 'past_due'
      where provider = p_provider and provider_subscription_id = v_sub_id;

  elsif v_type = 'subscription.canceled' then
    update public.subscriptions set status = 'canceled', cancel_at_period_end = true,
      current_period_end = least(coalesce(current_period_end, v_effective), v_effective)
      where provider = p_provider and provider_subscription_id = v_sub_id
      returning * into v_subscription;
    if found then
      update public.entitlements set valid_until = least(coalesce(valid_until, v_effective), v_effective)
        where source = 'subscription:' || v_subscription.id;
    end if;

  elsif v_type = 'purchase.completed' then
    insert into public.purchases (user_id, email, template_slug, amount, currency, provider, provider_payment_id, status)
    values (v_user, v_email, p_event ->> 'templateSlug', coalesce((p_event ->> 'amount')::numeric, 0),
      coalesce(nullif(p_event ->> 'currency', ''), 'USD'), p_provider, p_event ->> 'providerPaymentId', 'completed')
    on conflict (provider, provider_payment_id) do nothing
    returning id into v_purchase_id;
    if v_purchase_id is not null and v_user is not null then
      insert into public.entitlements (user_id, kind, ref, valid_until, source)
      values (v_user, 'template', p_event ->> 'templateSlug', now() + make_interval(days => v_access_days),
        'purchase:' || v_purchase_id)
      on conflict (source) do nothing;
    end if;

  elsif v_type = 'purchase.refunded' then
    update public.purchases set status = 'refunded'
      where provider = p_provider and provider_payment_id = p_event ->> 'providerPaymentId'
      returning id into v_purchase_id;
    if v_purchase_id is not null then
      update public.entitlements set valid_until = now() where source = 'purchase:' || v_purchase_id;
    end if;

  else
    v_result := 'ignored';
  end if;

  if v_user is not null and nullif(p_event ->> 'couponCode', '') is not null then
    perform public.redeem_coupon(p_event ->> 'couponCode', v_user, p_provider || ':' || p_event_id);
  end if;

  update public.payment_events set processed_at = now(), result = v_result where id = v_event_row;
  return v_result;
end;
$$;

-- Aprueba un pago manual: crea la suscripción o la compra y el entitlement, en una transacción.
create or replace function public.approve_manual_payment(p_payment_id uuid, p_admin_id uuid, p_access_days integer default 7)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.manual_payments%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_sub_id uuid;
  v_purchase_id uuid;
begin
  select * into v_payment from public.manual_payments where id = p_payment_id for update;
  if not found then raise exception 'Pago no encontrado'; end if;
  if v_payment.status <> 'pending' then raise exception 'El pago ya fue revisado'; end if;

  update public.manual_payments
    set status = 'approved', reviewed_by = p_admin_id, reviewed_at = now()
    where id = p_payment_id;

  if v_payment.kind = 'plan' then
    -- Si ya tiene acceso vigente al mismo plan, el nuevo período empieza al terminar el actual
    select greatest(now(), coalesce(max(valid_until), now())) into v_start
      from public.entitlements
      where user_id = v_payment.user_id and kind = 'plan' and ref = v_payment.plan_code and valid_until > now();
    v_start := coalesce(v_start, now());
    v_end := v_start + case when v_payment.billing_cycle = 'yearly' then interval '1 year' else interval '1 month' end;

    insert into public.subscriptions (user_id, plan_code, billing_cycle, status, provider, provider_subscription_id,
      current_period_end, cancel_at_period_end)
    values (v_payment.user_id, v_payment.plan_code, v_payment.billing_cycle, 'active', 'manual', v_payment.reference,
      v_end, true)
    returning id into v_sub_id;

    insert into public.entitlements (user_id, kind, ref, valid_until, source)
    values (v_payment.user_id, 'plan', v_payment.plan_code, v_end, 'subscription:' || v_sub_id);
  else
    insert into public.purchases (user_id, template_slug, amount, currency, provider, provider_payment_id, status)
    values (v_payment.user_id, v_payment.template_slug, v_payment.amount, v_payment.currency, 'manual', v_payment.reference, 'completed')
    returning id into v_purchase_id;

    v_end := now() + make_interval(days => p_access_days);
    insert into public.entitlements (user_id, kind, ref, valid_until, source)
    values (v_payment.user_id, 'template', v_payment.template_slug, v_end, 'purchase:' || v_purchase_id);
  end if;

  if v_payment.coupon_code is not null then
    perform public.redeem_coupon(v_payment.coupon_code, v_payment.user_id, 'manual:' || v_payment.reference);
  end if;

  return jsonb_build_object(
    'userId', v_payment.user_id,
    'kind', v_payment.kind,
    'planCode', v_payment.plan_code,
    'templateSlug', v_payment.template_slug,
    'validUntil', v_end
  );
end;
$$;

create or replace function public.reject_manual_payment(p_payment_id uuid, p_admin_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.manual_payments
    set status = 'rejected', reviewed_by = p_admin_id, reviewed_at = now(), rejection_reason = left(p_reason, 500)
    where id = p_payment_id and status = 'pending';
  if not found then raise exception 'Pago no encontrado o ya revisado'; end if;
end;
$$;

-- Las funciones que otorgan accesos solo las ejecuta el servidor (rol de servicio)
revoke execute on function public.increment_download_usage(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.get_download_usage(uuid, text) from public, anon, authenticated;
revoke execute on function public.redeem_coupon(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.grant_coupon_access(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.process_payment_event(text, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.approve_manual_payment(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.reject_manual_payment(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.increment_download_usage(uuid, text, integer) to service_role;
grant execute on function public.get_download_usage(uuid, text) to service_role;
grant execute on function public.redeem_coupon(text, uuid, text) to service_role;
grant execute on function public.grant_coupon_access(text, uuid, text) to service_role;
grant execute on function public.process_payment_event(text, text, text, jsonb, jsonb) to service_role;
grant execute on function public.approve_manual_payment(uuid, uuid, integer) to service_role;
grant execute on function public.reject_manual_payment(uuid, uuid, text) to service_role;
