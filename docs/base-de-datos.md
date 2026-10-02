# Base de datos (Supabase) — guía para ejecutar los scripts a mano

Los scripts SQL viven en `supabase/sql/` y se ejecutan **manualmente** en el
**SQL Editor** de Supabase, en orden numérico. Cada script es idempotente: si
lo vuelves a ejecutar no duplica tablas, políticas ni triggers.

> Todos los scripts se prueban automáticamente en un Postgres embebido
> (PGlite) con simulaciones de `auth`, `storage` y los roles de Supabase
> (`npm test` → `src/test/sql-*.test.ts`). Si un script tiene un error de
> sintaxis o una política no funciona como se espera, las pruebas fallan.

## Orden de ejecución

| Orden | Archivo                | Qué hace                                                                            |
| ----- | ---------------------- | ----------------------------------------------------------------------------------- |
| 1     | `001_esquema_base.sql` | Perfiles, configuraciones guardadas, descargas, RLS y trigger de perfiles (Fase 1). |
| 2     | `002_monetizacion.sql` | Planes, suscripciones, compras, entitlements, uso, cupones, pagos, eventos, admin.  |
| 3     | `003_storage.sql`      | Bucket privado `payment-proofs` para comprobantes de transferencia.                 |
| 4     | `004_semillas.sql`     | Planes (Gratis, Pro, Negocio, Compra única) y el cupón de ejemplo `LANZAMIENTO20`.  |

> **Importante al pasar a la Fase 2:** el script 002 quita a los usuarios el
> permiso de insertar en `downloads` y de crear o editar `saved_configs`
> directamente. Desde ese momento lo hace el servidor con la clave secreta
> (`SUPABASE_SECRET_KEY`), que aplica los límites del plan. Ejecuta 002 a 004
> **junto con el despliegue** del código de la Fase 2.

## Cómo ejecutarlos

1. Entra a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Copia el contenido completo del script, pégalo y presiona **Run**.
3. Revisa que termine sin errores y continúa con el siguiente.
4. Ejecuta las consultas de verificación del final de esta guía.

## Tablas de la Fase 1

### `profiles`

Un registro por usuario (se crea solo con el trigger `on_auth_user_created`).

| Columna                    | Tipo             | Notas                                                                     |
| -------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `id`                       | uuid PK          | = `auth.users.id`, se borra en cascada                                    |
| `full_name`                | text             | Toma `full_name` o `name` de los metadatos del registro (Google)          |
| `country`                  | text             | Código ISO de 2 letras, por defecto `HN`                                  |
| `plan`                     | enum `plan_tier` | `free` / `pro`. **El usuario no puede modificarlo** (permiso por columna) |
| `created_at`, `updated_at` | timestamptz      | `updated_at` se actualiza con trigger                                     |

### `saved_configs`

Configuraciones de plantillas para reutilizar.

| Columna                    | Tipo        | Notas                                                                  |
| -------------------------- | ----------- | ---------------------------------------------------------------------- |
| `id`                       | uuid PK     |                                                                        |
| `user_id`                  | uuid        | Por defecto `auth.uid()`                                               |
| `template_slug`            | text        | Slug de la plantilla (validado con regex)                              |
| `name`                     | text        | 1 a 120 caracteres                                                     |
| `country`                  | text        | País de las reglas usadas                                              |
| `config`                   | jsonb       | Configuración validada con el esquema Zod de la plantilla (máx. ~1 MB) |
| `created_at`, `updated_at` | timestamptz |                                                                        |

### `downloads`

Historial de descargas. `user_id` es nulo para descargas anónimas.

## Seguridad (RLS)

- RLS activado en todas las tablas.
- `profiles`: cada usuario lee y edita **solo su perfil** y solo las columnas `full_name` y `country`.
- `saved_configs`: CRUD solo sobre filas propias (`user_id = auth.uid()`).
- `downloads`: en la Fase 1 anónimos y usuarios podían insertar; **desde el script 002 solo el servidor inserta**. Cada usuario lee solo lo suyo.

## Tablas de la Fase 2 (monetización)

**Regla de oro:** el cliente nunca puede otorgarse un plan. `subscriptions`,
`entitlements`, `purchases`, `payment_events`, `usage_counters`,
`client_profiles` (alta y edición) y `manual_payments` solo las escribe el
servidor (rol de servicio) o un administrador. Los usuarios solo **leen** sus filas.

| Tabla                | Para qué sirve                                                                                            | Quién escribe             |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| `plans`              | Precios, límites (`limits`, mismas claves que `PlanLimits` en `src/config/plans.ts`) y beneficios.        | Admin                     |
| `subscriptions`      | Suscripciones por proveedor (`paddle`, `paypal`, `manual`, …), estado y fin del período.                  | Servidor / admin          |
| `purchases`          | Compras únicas de plantillas Pro.                                                                         | Servidor / admin          |
| `entitlements`       | **La fuente de verdad del acceso**: `kind` (`plan` o `template`), `ref`, `valid_until`, `source` (único). | Servidor / admin          |
| `usage_counters`     | Descargas por mes de cada cuenta (`user_id`) o visitante anónimo (`anon_id` de cookie firmada).           | Función `increment_…`     |
| `client_profiles`    | Perfiles de cliente o empresa del plan Negocio (nombre, RTN, logo como data URL, marca).                  | Servidor (el dueño borra) |
| `coupons`            | Cupones: `percent_off`, `max_redemptions`, `expires_at`, `applies_to`, `duration_months`.                 | Admin                     |
| `coupon_redemptions` | Un canje por usuario y cupón.                                                                             | Función `redeem_coupon`   |
| `payment_events`     | Cada webhook recibido, con `(provider, event_id)` único para ignorar duplicados.                          | Servidor                  |
| `manual_payments`    | Transferencias con referencia única, comprobante y estado `pending` / `approved` / `rejected`.            | Servidor / admin          |
| `events`             | Analítica propia: `paywall_view`, `checkout_start`, `payment_completed`, `download`, …                    | Servidor                  |

Columnas nuevas en tablas existentes:

- `profiles.role` (`user` / `admin`). El usuario no puede cambiarla (el permiso de
  `update` sigue limitado a `full_name` y `country`). La columna `profiles.plan`
  de la Fase 1 queda **obsoleta**: el código ya no la usa, el acceso se decide
  solo con `entitlements`.
- `saved_configs.rules_version` (versión de reglas con la que se guardó, p. ej.
  `HN-2026.1`) y `saved_configs.client_profile_id`.
- `downloads.anon_id` y `downloads.source` (`browser`, `server`, `batch`).

### Funciones (solo las ejecuta el servidor)

| Función                                                        | Qué hace                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `is_admin()`                                                   | `true` si el usuario actual tiene `role = 'admin'`. La usan las políticas RLS.                                                 |
| `process_payment_event(provider, event_id, type, payload, ev)` | Guarda el webhook y, si no es duplicado, crea o actualiza suscripción, compra y entitlement **en la misma transacción**.       |
| `approve_manual_payment(payment_id, admin_id, access_days)`    | Aprueba una transferencia: crea la suscripción (mensual o anual, encadenada si ya tenía acceso) o la compra, y el entitlement. |
| `reject_manual_payment(payment_id, admin_id, reason)`          | Rechaza con motivo.                                                                                                            |
| `increment_download_usage(user_id, anon_id, limit)`            | Suma una descarga **solo si** no se pasó del límite del mes. Atómica: dos descargas simultáneas no pueden saltarse el límite.  |
| `get_download_usage(user_id, anon_id)`                         | Descargas usadas en el mes actual.                                                                                             |
| `redeem_coupon(code, user_id, context)`                        | Canjea un cupón (una vez por usuario, respeta máximo y vencimiento).                                                           |
| `grant_coupon_access(code, user_id, plan_code)`                | Cupón del 100 %: canjea y otorga el plan por `duration_months`.                                                                |

`process_payment_event` recibe el evento ya **verificado y normalizado** por el
adaptador del proveedor (`src/payments/`), con esta forma:

```json
{
  "type": "subscription.activated | subscription.renewed | subscription.updated | subscription.past_due | subscription.canceled | purchase.completed | purchase.refunded",
  "userId": "uuid (o null)",
  "email": "si no llegó userId, se busca por correo",
  "planCode": "pro",
  "cycle": "monthly",
  "providerSubscriptionId": "sub_…",
  "currentPeriodEnd": "2026-11-02T00:00:00Z",
  "templateSlug": "planilla-de-sueldos",
  "providerPaymentId": "txn_…",
  "amount": 5,
  "accessDays": 7,
  "couponCode": "LANZAMIENTO20"
}
```

### Almacenamiento

`003_storage.sql` crea el bucket **privado** `payment-proofs` (máx. 5 MB; PNG,
JPEG, WebP o PDF). Los archivos se guardan como `<user_id>/<referencia>.<ext>`
y los sube el servidor. El usuario puede ver los suyos y los admins todos; el
panel `/admin/pagos` los abre con URLs firmadas de corta duración.

> Si el script 003 falla con un error de permisos sobre `storage.buckets`,
> crea el bucket desde **Storage → New bucket** (nombre `payment-proofs`,
> _Public_ desactivado, límite 5 MB) y ejecuta solo la parte de la política.

### Hacerte administrador

Después de registrarte en el sitio, ejecuta (con tu correo):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```

### Cambiar precios o límites

Edita la fila en **Table Editor → plans** (o con SQL). Los cambios se ven en
`/precios` y en los límites en un máximo de 5 minutos (caché del servidor).

```sql
update public.plans set price_monthly_usd = 7, price_yearly_usd = 60 where code = 'pro';
update public.plans set limits = jsonb_set(limits, '{downloadsPerMonth}', '10') where code = 'free';
```

Si usas Paddle o PayPal, el precio que se cobra es el del **producto en el
proveedor** (variables `PADDLE_PRICE_*` / `PAYPAL_PLAN_*`); actualiza ambos.

### Otorgar acceso a mano (cortesía o soporte)

```sql
insert into public.entitlements (user_id, kind, ref, valid_until, source)
values (
  (select id from auth.users where email = 'cliente@ejemplo.com'),
  'plan', 'pro', now() + interval '1 month', 'admin:cortesia-2026-10'
);
```

## Configuración de Auth

1. **Authentication → URL Configuration**
   - _Site URL_: `https://excel.codezun.com` (o `http://localhost:3000` en desarrollo).
   - _Redirect URLs_: agrega `http://localhost:3000/auth/callback` y `https://excel.codezun.com/auth/callback`.
2. **Authentication → Providers → Email**: activo (con confirmación de correo).
3. **Authentication → Providers → Google**: crea credenciales OAuth en Google Cloud
   (tipo _Aplicación web_), con el URI de redirección que muestra Supabase
   (`https://<tu-proyecto>.supabase.co/auth/v1/callback`), y pega el Client ID y el Secret.
4. (Opcional) Plantilla de correo de confirmación con `token_hash`:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/cuenta`.

## Consultas de verificación

```sql
-- Tablas con RLS activado
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- Políticas creadas
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename;

-- Trigger de perfiles
select tgname from pg_trigger where tgname = 'on_auth_user_created';

-- Planes sembrados
select code, price_monthly_usd, price_yearly_usd, price_once_usd from public.plans order by sort_order;

-- Funciones de la Fase 2 (deben aparecer 8)
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_admin', 'process_payment_event', 'approve_manual_payment', 'reject_manual_payment',
                  'increment_download_usage', 'get_download_usage', 'redeem_coupon', 'grant_coupon_access');

-- Bucket privado
select id, public from storage.buckets where id = 'payment-proofs';
```
