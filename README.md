# Excel Codezun · excel.codezun.com

Generador de plantillas de Excel configurables. La persona elige una plantilla, responde un formulario, ve una vista previa y descarga un archivo **.xlsx con fórmulas reales**, formatos, validaciones y una hoja de instrucciones.

Primer mercado: **Honduras** (lempira, ISV, IHSS, RAP, ISR). La arquitectura permite agregar más países de Latinoamérica sin rehacer las plantillas.

- **45 plantillas implementadas** (factura con ISV, planilla con IHSS/RAP/ISR, décimos, prestaciones, declaración del ISV, ISR anual, libro de ventas y compras, inventario, kardex, caja diaria, fiados, préstamos, remesas, patronato, caja rural, notas escolares y más). Cada una tiene pruebas automáticas que **evalúan sus fórmulas** con un motor compatible con Excel.
- **99 plantillas en el catálogo**: el resto aparece como "Próximamente".

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

| Variable                               | Uso                                                           |
| -------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | URL pública (SEO, sitemap, redirecciones de auth)             |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto de Supabase                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (`sb_publishable_…` o la clave `anon` heredada) |

## Estructura de carpetas

```
src/
├─ app/                       # Rutas (App Router)
│  ├─ page.tsx                # Landing
│  ├─ plantillas/             # Catálogo y /plantillas/[slug]
│  ├─ [pais]/plantillas/[slug]# Ruta por país (hn) para SEO local
│  ├─ (auth)/                 # login, registro, recuperar, actualizar-contrasena
│  ├─ auth/callback|confirm   # Intercambio de sesión de Supabase
│  ├─ cuenta/                 # Panel del usuario
│  ├─ api/preview|generate    # Generación en el servidor (plantillas Pro)
│  ├─ precios, aviso-legal, terminos, privacidad, reembolsos
│  └─ sitemap.ts, robots.ts, opengraph-image.tsx
├─ components/                # UI (shadcn), layout, landing, catálogo, formulario dinámico, vista previa
├─ countries/                 # Reglas por país (hn.ts) — única fuente de tasas y valores legales
├─ templates/                 # Registro de plantillas
│  ├─ types.ts                # TemplateDefinition, FormFieldDef…
│  ├─ catalog.ts              # Catálogo (solo metadatos)
│  ├─ coming-soon.ts          # Entradas "Próximamente"
│  ├─ registry/               # Cargadores: formularios, builds del navegador y del servidor
│  ├─ shared/                 # Campos y esquemas reutilizables, amortización, matrices…
│  └─ <categoria>/<slug>/     # meta.ts · form.ts · build.ts · index.ts
├─ lib/excel/                 # Motor ExcelJS: tablas, parámetros, instrucciones, monto en letras, documentos, vista previa
├─ lib/supabase/              # Clientes (navegador, servidor) y proxy de sesión
├─ i18n/                      # Diccionario de textos de interfaz (es)
└─ proxy.ts                   # Proxy de Next 16 (antes "middleware")
supabase/sql/                 # Scripts SQL para ejecutar a mano (ver docs/base-de-datos.md)
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
3. Los usuarios sin cuenta pueden generar y descargar plantillas gratis. Guardar configuraciones requiere iniciar sesión.

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

## Despliegue en Vercel

1. Importa el repositorio en Vercel (framework: Next.js).
2. Configura las variables de entorno de `.env.example`.
3. Agrega el dominio `excel.codezun.com` y actualiza las URL de redirección en Supabase.
