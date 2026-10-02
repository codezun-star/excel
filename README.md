# Excel Codezun · excel.codezun.com

Generador de plantillas de Excel configurables. La persona elige una plantilla, responde un formulario, ve una vista previa y descarga un archivo **.xlsx con fórmulas reales**, formatos, validaciones y una hoja de instrucciones.

Primer mercado: **Honduras** (lempira, ISV, IHSS, RAP, ISR). La arquitectura permite agregar más países de Latinoamérica sin rehacer las plantillas.

- **45 plantillas implementadas** (factura con ISV, planilla con IHSS/RAP/ISR, décimos, prestaciones, declaración del ISV, ISR anual, libro de ventas y compras, inventario, kardex, caja diaria, fiados, préstamos, remesas, patronato, caja rural, notas escolares y más). Cada una tiene pruebas automáticas que **evalúan sus fórmulas** con un motor compatible con Excel.
- **99 plantillas en el catálogo**: el resto aparece como "Próximamente".
- **Monetización freemium** (Fase 2): plan Gratis con límite mensual, Pro, Negocio/Contador y compra única. Pagos con **tarjeta (Paddle)** y **transferencia o depósito a BAC, Atlántida o Promerica** con revisión en `/admin/pagos`.
- **Blog con 12 guías** y **7 calculadoras gratis** para Honduras (décimo cuarto, aguinaldo, prestaciones, ISR, ISV, horas extra y préstamos) que llevan a las plantillas. Las tasas de las guías y calculadoras salen del mismo módulo de reglas que las plantillas.

## Stack (versiones estables fijadas)

| Paquete                         | Versión                                              |
| ------------------------------- | ---------------------------------------------------- |
| Next.js (App Router, Turbopack) | 16.3.8                                               |
| React                           | 19.3.0                                               |
| TypeScript (strict)             | 6.0.3                                                |
| Tailwind CSS                    | 4.3.3                                                |
| shadcn/ui (Radix UI)            | radix-ui 1.6.7                                       |
| Supabase                        | @supabase/ssr 0.12.7 · @supabase/supabase-js 2.117.2 |
| ExcelJS                         | 4.4.0                                                |
| Zod                             | 4.6.5                                                |
| react-hook-form                 | 7.89.0 (+ @hookform/resolvers 5.9.1)                 |
| Vitest                          | 5.0.3                                                |
| ESLint / Prettier               | 9.39.5 / 3.9.9                                       |

> **Por qué estas versiones:** se usó la última versión estable de cada paquete. Hay dos excepciones: TypeScript 7 y ESLint 10 ya son estables, pero `typescript-eslint` y `eslint-plugin-react` (usados por `eslint-config-next`) todavía no los soportan. Por eso se fijaron TypeScript 6.0.3 y ESLint 9.39.5.

## Requisitos

- Node.js 22.12 o superior
- npm 10+

## Cómo correr el proyecto

```bash
npm install
cp .env.example .env.local   # completa las variables (opcional para empezar)
npm run dev                  # http://localhost:3000
```

Sin variables de Supabase el sitio funciona igual: se pueden generar y descargar plantillas. Solo se desactivan el inicio de sesión y las funciones de cuenta.

### Scripts

| Script                            | Qué hace                                                   |
| --------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                                     |
| `npm run build` / `npm start`     | Compilación y servidor de producción                       |
| `npm run lint`                    | ESLint (configuración de Next.js + TypeScript)             |
| `npm run format` / `format:check` | Prettier (con orden de clases de Tailwind)                 |
| `npm run typecheck`               | TypeScript sin emitir                                      |
| `npm test`                        | Vitest: plantillas, fórmulas, catálogo, vista previa y SQL |

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). Nunca subas claves reales.

| Variable                               | Uso                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | URL pública (SEO, sitemap, redirecciones de auth)                          |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto de Supabase                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (`sb_publishable_…` o la clave `anon` heredada)              |
| `SUPABASE_SECRET_KEY`                  | Clave secreta (solo servidor): descargas, webhooks, pagos, configuraciones |
| `ANON_ID_SECRET`                       | Firma la cookie del visitante anónimo (límite sin cuenta)                  |
| `NEXT_PUBLIC_USD_HNL_RATE`             | Tipo de cambio de referencia USD → HNL                                     |
| `NEXT_PUBLIC_REFUND_DAYS` / `_TEXT`    | Garantía que se muestra en `/precios`                                      |
| `DEV_GRANT_PLAN`                       | Solo desarrollo: da un plan a todos (`pro` o `negocio`)                    |
| `PAYMENTS_PADDLE_ENABLED`, `PADDLE_*`  | Pagos con tarjeta (ver «Medios de pago»)                                   |
| `PAYMENTS_MANUAL_ENABLED`, `BANK_*`    | Transferencias a BAC, Atlántida y Promerica                                |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`…    | Correos de pagos manuales (por defecto, en la consola del servidor)        |

## Estructura de carpetas

```
src/
├─ app/                       # Rutas (App Router)
│  ├─ page.tsx                # Landing
│  ├─ plantillas/             # Catálogo y /plantillas/[slug]
│  ├─ [pais]/plantillas/[slug]# Ruta por país (hn) para SEO local
│  ├─ (auth)/                 # login, registro, recuperar, actualizar-contrasena
│  ├─ auth/callback|confirm   # Intercambio de sesión de Supabase
│  ├─ [pais]/calculadoras/    # Calculadoras gratis (/hn/calculadoras/…)
│  ├─ blog/                   # Blog, artículos, categorías y RSS
│  ├─ cuenta/                 # Panel del usuario, suscripción y clientes
│  ├─ checkout/               # Pago (Paddle o transferencia) con cupón
│  ├─ pago/paddle/            # «Default payment link» de Paddle (abre Paddle.js)
│  ├─ admin/                  # Resumen, pagos, usuarios, descargas y cupones
│  ├─ api/generate|preview    # Generación en el servidor (Pro) con acceso y límites
│  ├─ api/downloads           # Autoriza y cuenta descargas de plantillas gratis
│  ├─ api/webhooks/[provider] # Webhooks firmados (Paddle)
│  ├─ api/checkout, coupons, batch, events, me/access
│  ├─ precios, aviso-legal, terminos, privacidad, reembolsos
│  └─ sitemap.ts, robots.ts, opengraph-image.tsx
├─ components/                # UI (shadcn), layout, landing, catálogo, formulario dinámico, vista previa
├─ config/plans.ts            # Planes, precios y límites POR DEFECTO (la base de datos manda)
├─ content/blog/              # Artículos (datos + cálculos con las reglas del país)
├─ content/calculators/       # Metadatos de las calculadoras
├─ countries/                 # Reglas por país (hn.ts) — única fuente de tasas y valores legales
├─ payments/                  # Capa de pagos: PaymentProvider, Paddle, transferencias, cupones, webhooks
├─ templates/                 # Registro de plantillas
│  ├─ types.ts                # TemplateDefinition, FormFieldDef…
│  ├─ catalog.ts              # Catálogo (solo metadatos)
│  ├─ coming-soon.ts          # Entradas "Próximamente"
│  ├─ registry/               # Cargadores: formularios, builds del navegador y del servidor
│  ├─ shared/                 # Campos y esquemas reutilizables, amortización, matrices…
│  └─ <categoria>/<slug>/     # meta.ts · form.ts · build.ts · index.ts
├─ lib/excel/                 # Motor ExcelJS: tablas, parámetros, instrucciones, monto en letras, documentos, vista previa
├─ lib/supabase/              # Clientes (navegador, servidor) y proxy de sesión
├─ lib/billing/               # getUserEntitlements, planes, uso mensual, cookie anónima, admin
├─ lib/downloads/             # Autorización de descargas y generación en el servidor
├─ lib/email/                 # Interfaz de correo (consola o Resend)
├─ i18n/                      # Diccionario de textos de interfaz (es)
└─ proxy.ts                   # Proxy de Next 16 (antes "middleware")
supabase/sql/                 # Scripts SQL para ejecutar a mano (ver docs/base-de-datos.md)
scripts/                      # Utilidades (webhook de Paddle firmado para pruebas locales)
docs/                         # Documentación adicional
```

## Arquitectura de plantillas

Cada plantilla vive en `src/templates/<categoria>/<slug>/` y se divide en cuatro archivos para no inflar el navegador:

| Archivo    | Contenido                                              | Se usa en                                                       |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `meta.ts`  | Título, descripción, categoría, tier, SEO, qué incluye | Catálogo, páginas, sitemap (sin ExcelJS)                        |
| `form.ts`  | `configSchema` (Zod), `formFields`, `defaultConfig`    | Formulario en el navegador y validación en el servidor          |
| `build.ts` | `build(config, ctx, options)` con ExcelJS              | Navegador (gratis) o servidor (Pro, con `import "server-only"`) |
| `index.ts` | `defineTemplate(meta, form, build)`                    | Servidor y pruebas                                              |

- El formulario se arma solo a partir de `formFields`: texto, número, fecha, selector, multiselección, switch, color, lista editable e imagen (el logo se redimensiona en el navegador).
- Las fórmulas son **fórmulas reales de Excel** compatibles con Google Sheets y LibreOffice. Se evitan funciones posteriores a Excel 2010, los literales `TRUE`/`FALSE` y `MOD` con negativos.
- Cada archivo trae una hoja **Parámetros** (todas las tasas salen del módulo del país), una hoja **Instrucciones**, validaciones con listas desplegables, formato condicional y hojas protegidas sin contraseña.
- Las plantillas **gratis** se generan en el navegador: los datos de la persona no salen de su equipo. Las **Pro** se generan en `/api/generate/[slug]` y su código nunca se envía al navegador (lo comprueba una prueba automática).

### Cómo agregar una plantilla nueva (paso a paso)

1. **Crea la carpeta** `src/templates/<categoria>/<slug>/`.
2. **`meta.ts`**: usa `defineMeta({...})` con `slug`, `title`, `shortDescription`, `category`, `tier` (`"free"` o `"pro"`), `countries` (`["HN"]` si usa reglas locales o se omite para "ALL"), `regulated` (`"fiscal"`/`"laboral"` si aplica) y `details`.
3. **`form.ts`**: define el `configSchema` con Zod (reutiliza `shared/schema.ts`, `shared/ledger-form.ts`, `shared/document-form.ts`) y los `formFields`. Incluye siempre `color` y `example` (datos de ejemplo).
4. **`build.ts`**: construye el workbook con las utilidades de `src/lib/excel`:
   - `createWorkbook`, `addSheet`, `addTable` (tablas con fórmulas, validaciones y totales), `addFields` (bloques de etiqueta y valor), `addParametersSheet` (tasas del país), `addListsSheet`, `addMonthGrid`, `addMonthlySummary`/`addCategorySummary`, `addCommercialDocument` (facturas y similares), `amountInWordsRef` (monto en letras) y `addInstructionsSheet`.
   - **Nunca escribas tasas, techos ni porcentajes legales en la plantilla**: léelos de `ctx` y llévalos a la hoja Parámetros. Una prueba revisa que ningún valor legal del país aparezca dentro de una fórmula.
   - Si la plantilla es Pro, agrega `import "server-only";` al inicio de `build.ts`.
5. **`index.ts`**: `export default defineTemplate(meta, form, build);`
6. **Regístrala**:
   - `src/templates/registry/ready-metas.ts` → importa y agrega su `meta`.
   - `src/templates/registry/forms.ts` → su cargador de formulario.
   - `src/templates/registry/server.ts` → su cargador completo.
   - `src/templates/registry/client-builders.ts` → **solo si es gratis**.
   - Quita su entrada de `src/templates/coming-soon.ts` si existía.
7. **Pruebas**: `npm test`. La prueba genérica (`all-templates.test.ts`) la genera con y sin datos de ejemplo, evalúa todas sus fórmulas y verifica que no haya errores ni valores legales escritos a mano. Agrega a `calculations.test.ts` una verificación de los resultados clave con los datos de ejemplo.

### Cómo agregar un país nuevo

1. Copia `src/countries/hn.ts` como `src/countries/<codigo>.ts` y completa el `CountryContext`: moneda y denominaciones, identificador tributario, impuesto sobre ventas (`taxes.salesTax`, con su nombre: IVA, ITBMS…), ISR, seguridad social, aportes patronales, reglas laborales, salario mínimo y datos de facturación.
2. Marca cada valor legal con `// TODO: VERIFICAR VALOR VIGENTE` hasta confirmarlo con fuentes oficiales y deja `reviewStatus: "pending"`. Así la interfaz muestra un aviso.
3. Regístralo en `src/countries/index.ts` (en `CONTEXTS` y con `status: "active"` en `COUNTRIES`).
4. Las plantillas con `countries: "ALL"` funcionan de inmediato con la moneda y las tasas del país. Para las que hoy son solo `["HN"]`, revisa que la lógica aplique y agrega el código del país.
5. Se generan solas las rutas `/<pais>/plantillas/<slug>` y sus entradas en el sitemap.

## Supabase

1. Crea un proyecto en Supabase y copia la URL y la clave pública en `.env.local`.
2. Ejecuta a mano los scripts de `supabase/sql/` en el **SQL Editor**, en orden. En [`docs/base-de-datos.md`](docs/base-de-datos.md) está el detalle de cada tabla, política, trigger, la configuración de Auth (correo y Google) y las consultas de verificación.
3. Copia también la **clave secreta** (`SUPABASE_SECRET_KEY`): sin ella no se registran descargas, pagos ni webhooks (en desarrollo, el uso se cuenta en memoria).
4. Scripts: `001_esquema_base.sql`, `002_monetizacion.sql`, `003_storage.sql` y `004_semillas.sql`. Ejecuta 002 a 004 junto con el despliegue de la Fase 2: a partir de 002 las descargas y las configuraciones solo las escribe el servidor.
5. **Hazte administrador** después de registrarte (con tu correo):

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
   ```

## Monetización (Fase 2)

### Planes

| Plan               | Precio (marcador)    | Incluye                                                                                                                  |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Gratis             | 0                    | Plantillas gratis, 5 descargas al mes con cuenta (3 sin cuenta), marca de agua en Instrucciones                          |
| Pro                | 6 USD/mes · 50/año   | Todas las plantillas, descargas sin límite razonable (300/mes), configuraciones, logo, sin marca de agua, aviso de tasas |
| Negocio / Contador | 20 USD/mes · 200/año | Todo Pro + 25 perfiles de cliente, marca propia y descarga por lote                                                      |
| Compra única       | 5 USD                | Una plantilla Pro con 7 días para corregir y volver a descargar                                                          |

Los precios y límites viven en la tabla **`plans`** (con `src/config/plans.ts` como respaldo si la base no responde). Se muestra una referencia en lempiras con `NEXT_PUBLIC_USD_HNL_RATE`.

### Cómo se decide el acceso

- **`getUserEntitlements(userId)`** (`src/lib/billing/entitlements.ts`) es la única fuente de decisión: lee `entitlements` vigentes y devuelve el plan de mayor nivel, sus límites y las plantillas compradas.
- Plantillas **gratis**: se generan en el navegador, pero antes cada descarga pasa por **`/api/downloads`**, que aplica el límite mensual (cuentas por `user_id`; anónimos por una cookie **firmada** `ec_anon`) y devuelve si lleva marca de agua.
- Plantillas **Pro**: solo en **`/api/generate/[slug]`** (runtime Node, `server-only`): valida sesión, entitlement (**403** sin acceso), límite (**429**) y la configuración con Zod. Sin acceso, la vista previa es limitada (sin fórmulas y con valores enmascarados).
- Los campos marcados `proOnly` (logo) se ignoran en el servidor para el plan gratis.
- **Nunca se concede acceso por la redirección del navegador**: solo con el webhook verificado o la aprobación de un admin.
- Límite de solicitudes en memoria por instancia (`src/lib/rate-limit.ts`). Para un límite global, cámbialo por Upstash Redis con la misma interfaz.

### Medios de pago

**Tarjeta con Paddle** (Paddle cobra como _merchant of record_ e incluye impuestos y recibos):

1. Crea la cuenta en Paddle (empieza en **sandbox**) y los productos: Pro mensual, Pro anual, Negocio mensual, Negocio anual y «Compra única» (pago único de 5 USD).
2. Copia los `price_id` en `PADDLE_PRICE_PRO_MONTHLY`, `PADDLE_PRICE_PRO_YEARLY`, `PADDLE_PRICE_NEGOCIO_MONTHLY`, `PADDLE_PRICE_NEGOCIO_YEARLY` y `PADDLE_PRICE_TEMPLATE`.
3. En **Developer tools → Authentication** crea la API key (`PADDLE_API_KEY`) y un _client-side token_ (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`).
4. En **Checkout → Checkout settings** define el _Default payment link_ como `https://excel.codezun.com/pago/paddle` y aprueba tu dominio.
5. En **Developer tools → Notifications** crea un destino `https://excel.codezun.com/api/webhooks/paddle` con los eventos `subscription.*`, `transaction.completed` y `adjustment.*`; copia su secreto en `PADDLE_WEBHOOK_SECRET`.
6. `PADDLE_ENVIRONMENT=sandbox` (o `production`) y `PAYMENTS_PADDLE_ENABLED=true`.

El plan se deduce del `price_id` recibido (no de datos que pueda alterar el cliente). Para cupones con tarjeta, crea el descuento en Paddle y pega su id (`dsc_…`) al crear el cupón en `/admin/cupones`.

**Transferencia o depósito (BAC, Atlántida, Promerica)**:

1. Completa `MANUAL_BANK_ACCOUNT_HOLDER` y, por banco, `BANK_BAC_ACCOUNT_NUMBER`, `BANK_ATLANTIDA_ACCOUNT_NUMBER`, `BANK_PROMERICA_ACCOUNT_NUMBER` (con `*_ACCOUNT_TYPE` y `*_CURRENCY`). Solo aparecen los bancos con número de cuenta.
2. El cliente ve el monto en lempiras, una **referencia única** (p. ej. `EXC-PRO-7K2M9Q`) y sube el comprobante (imagen o PDF, máx. 4 MB) al bucket privado `payment-proofs`.
3. Recibes un correo en `ADMIN_NOTIFICATION_EMAIL` (o se imprime en la consola si no hay proveedor de correo).

### Aprobar un pago manual

1. Entra a **`/admin/pagos`** con tu usuario administrador.
2. En «Por revisar» abre el comprobante (URL firmada de 10 minutos) y verifica en tu banca el **monto**, la **referencia** y el **banco**.
3. Presiona **Aprobar**: en una sola transacción se crea la suscripción (mensual o anual, encadenada si ya tenía acceso) o la compra única, y el entitlement. El cliente recibe un correo.
4. Si algo no cuadra, **Rechazar** con un motivo (se le envía al cliente).

### Probar webhooks en local

1. Arranca el sitio (`npm run dev`) con `PADDLE_WEBHOOK_SECRET` y `SUPABASE_SECRET_KEY` en `.env.local`.
2. Opción A — sin Paddle: envía un evento firmado con el script incluido:

   ```bash
   PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx PADDLE_PRICE_PRO_MONTHLY=pri_xxx \
     node scripts/paddle-webhook-local.mjs activar <user-id>
   # luego: cancelar | compra
   ```

   Si repites el mismo `event_id`, la respuesta es `duplicate` (idempotencia). Con una firma inválida, `400`.

3. Opción B — con Paddle sandbox: expón tu servidor con `cloudflared tunnel --url http://localhost:3000` (o ngrok), usa esa URL en el destino de notificaciones y lanza eventos desde **Notifications → Simulate**.

### Cambiar precios

- Edita la fila en **Table Editor → plans** (o con SQL, ver `docs/base-de-datos.md`). Se refleja en `/precios` y en los límites en máximo 5 minutos.
- Con Paddle, actualiza también el precio del producto en Paddle (es el que se cobra).
- Los valores de `src/config/plans.ts` son solo el respaldo si la base no está disponible.

### Marcar una plantilla como Pro

1. En su `meta.ts` cambia `tier: "free"` por `tier: "pro"`.
2. Agrega `import "server-only";` al inicio de su `build.ts`.
3. Quítala de `src/templates/registry/client-builders.ts` (las Pro solo se generan en el servidor).
4. `npm test`: una prueba falla si un build Pro queda accesible desde el navegador.

### Cupones, perfiles y avisos

- **Cupones** en `/admin/cupones`: porcentaje, usos máximos, vencimiento, a qué aplica y duración. Un cupón del 100 % activa el plan sin pago (desde el checkout o en «Mi suscripción → ¿Tienes un cupón de acceso?»). El canje se registra una vez por usuario.
- **Perfiles de cliente** (`/cuenta/clientes`): Pro tiene 1 y Negocio 25. En cada plantilla, «Llenar con un perfil» completa nombre, RTN, dirección, logo y color; Negocio descarga para varios clientes en un `.zip`.
- **Aviso de tasas**: cada configuración guarda `rules_version`. Si cambian las reglas del país, en «Mi cuenta» aparece «Hay una versión más reciente de tu plantilla» (con Pro se regenera en un clic).
- **Analítica propia** en la tabla `events`: vista del paywall, clic de mejora, inicio de pago, pago completado y descarga. El embudo se ve en `/admin`.

## Blog y calculadoras (SEO para Honduras)

- **Blog** en `/blog` con artículos en `src/content/blog/articles/`. Cada artículo es un objeto con metadatos SEO, preguntas frecuentes y un `body(ctx)` que recibe las reglas del país: los ejemplos se **calculan** con las mismas tasas que las plantillas (`src/content/blog/calc.ts`), así nunca se contradicen.
- **Calculadoras** en `/hn/calculadoras/<slug>`: usan los mismos cálculos (probados) y enlazan a su plantilla y su guía.
- SEO: JSON-LD (`BlogPosting`, `FAQPage`, `HowTo`, `BreadcrumbList`, `WebApplication`, `Organization`), imagen Open Graph por página, `lang="es-HN"`, metadatos `geo.region=HN`, RSS en `/blog/rss.xml` y todo en el sitemap. Las guías enlazan a las plantillas y las páginas de plantilla muestran sus guías y calculadoras.
- **Agregar un artículo**: crea `src/content/blog/articles/<nombre>.ts` (copia uno existente), regístralo en `src/content/blog/index.ts` y corre `npm test`: la prueba revisa longitud del título y la descripción, que las plantillas existan y que **todos los enlaces internos** apunten a páginas reales.

## Valores fiscales y laborales

Todos los valores legales de Honduras están en `src/countries/hn.ts`, marcados con `// TODO: VERIFICAR VALOR VIGENTE`. Se recopilaron de fuentes secundarias (prensa y guías especializadas) en octubre de 2026 porque los sitios oficiales no fueron accesibles desde el entorno de desarrollo. **Deben confirmarse con La Gaceta, el SAR, la STSS, el IHSS y el RAP antes de publicar.** Cuando se confirmen:

1. Actualiza los valores, `lastReviewed` y `rulesVersion`.
2. Cambia `reviewStatus` a `"verified"` para quitar el aviso de "pendiente de verificación".

La tabla de salario mínimo tiene algunas celdas en `null` (rama × tamaño de empresa no confirmadas). Se muestran vacías y el verificador indica "Por verificar".

## Decisiones tomadas

- **Metadatos separados de la implementación** para que el catálogo, el SEO y el sitemap no carguen ExcelJS. El build de cada plantilla gratis se carga solo en su página.
- **Plantillas "Próximamente"** en un único archivo (`coming-soon.ts`). Al implementarse, pasan a su propia carpeta.
- **`taxes.salesTax`** es un nombre genérico ("ISV" en Honduras, "IVA" en otros países), en lugar de `taxes.isv`, para que la misma plantilla sirva en varios países.
- **Canónicas:** las plantillas de un solo país (fiscales o laborales) usan `/hn/plantillas/<slug>` como URL canónica. Las generales usan `/plantillas/<slug>`. Las plantillas "Próximamente" llevan `noindex` y no van al sitemap.
- **Monto en letras** sin macros: una hoja oculta "Letras" con las palabras de 0 a 999 combinadas con fórmulas compatibles con Excel 2007+ y Google Sheets.
- **Base comercial de 360 días** (`DAYS360` método europeo) para proporcionales laborales, definida en `labor.dayBasis` del país.
- **Protección de hojas sin contraseña**, para evitar borrar fórmulas por accidente sin bloquear a la persona.
- **Pruebas de fórmulas** con HyperFormula (licencia GPLv3), que es solo una dependencia de desarrollo: nunca se envía al navegador ni al servidor de producción.
- **Pruebas de SQL** con PGlite (Postgres en WASM) y simulaciones de `auth`, `storage` y los roles de Supabase.
- **Modo claro por defecto**, con modo oscuro listo con los mismos tokens (botón en el encabezado).
- **i18n:** los textos de interfaz compartidos están en `src/i18n/es.ts`. El contenido de las páginas de marketing y de las plantillas sigue en español dentro de cada componente.
- **Selector de país:** solo Honduras está activo. Los demás aparecen como "Próximamente".
- **Fase 2 — pagos:** solo **Paddle** para tarjeta (sin PayPal ni pasarelas locales, por decisión del negocio) y **transferencias a BAC, Atlántida y Promerica**. La interfaz `PaymentProvider` permite agregar otro proveedor sin tocar el resto.
- **Fase 2 — fuente de verdad:** `entitlements`. La columna `profiles.plan` de la Fase 1 quedó obsoleta.
- **Fase 2 — idempotencia:** cada webhook se guarda en `payment_events` con `(provider, event_id)` único y se aplica en la misma transacción SQL (`process_payment_event`). Un error revierte todo y el proveedor reintenta.
- **Fase 2 — límite anónimo «blando»:** quien borra la cookie obtiene otra; es suficiente para empujar a crear una cuenta sin pedir datos personales.
- **Fase 2 — compras únicas** no consumen el límite mensual de descargas (ya se pagaron).
- **Fase 2 — correos** con una interfaz mínima: consola en desarrollo, Resend con `EMAIL_PROVIDER=resend`.
- **Precios en dólares** con referencia en lempiras; en transferencias se paga el monto en lempiras al tipo de cambio configurado.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (framework: Next.js).
2. Configura las variables de entorno de `.env.example` (las secretas, como `SUPABASE_SECRET_KEY`, `ANON_ID_SECRET`, `PADDLE_API_KEY` y `PADDLE_WEBHOOK_SECRET`, sin el prefijo `NEXT_PUBLIC_`).
3. Agrega el dominio `excel.codezun.com` y actualiza las URL de redirección en Supabase.
4. Configura Paddle (Default payment link y destino de webhooks) con el dominio final.
5. Envía el sitemap (`/sitemap.xml`) en Google Search Console y Bing Webmaster Tools, con Honduras como país de destino.
