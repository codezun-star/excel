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

Los scripts de la Fase 2 (monetización) se documentan más abajo en este mismo archivo.

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

- RLS activado en las tres tablas.
- `profiles`: cada usuario lee y edita **solo su perfil** y solo las columnas `full_name` y `country`.
- `saved_configs`: CRUD solo sobre filas propias (`user_id = auth.uid()`).
- `downloads`: anónimos y usuarios pueden **insertar** (los anónimos solo con `user_id` nulo); cada usuario **lee solo lo suyo**.

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
```
