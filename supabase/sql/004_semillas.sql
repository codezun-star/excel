-- =============================================================================
-- Excel Codezun — 004: datos iniciales (planes y un cupón de ejemplo)
-- Los precios son marcadores de posición: cámbialos aquí o directamente en la
-- tabla `plans` (Table Editor). Este script NO sobrescribe planes existentes
-- (on conflict do nothing), así que puedes volver a ejecutarlo sin perder cambios.
-- Las claves de `limits` coinciden con PlanLimits en src/config/plans.ts.
-- =============================================================================

insert into public.plans
  (code, name, description, price_monthly_usd, price_yearly_usd, price_once_usd, limits, features, highlight, sort_order)
values
  (
    'free', 'Gratis', 'Para empezar y para lo básico del día a día.', 0, 0, null,
    '{"downloadsPerMonth": 5, "anonDownloadsPerMonth": 3, "proTemplates": false, "saveConfigs": false,
      "watermark": true, "customLogo": false, "rateUpdates": false, "clientProfiles": 0,
      "whiteLabel": false, "batchDownload": false}',
    '["Todas las plantillas gratis", "5 descargas al mes con cuenta (3 sin cuenta)",
      "Fórmulas, validaciones e instrucciones", "Marca de agua sutil en la hoja de instrucciones"]',
    false, 1
  ),
  (
    'pro', 'Pro', 'Para negocios que usan sus plantillas todos los meses.', 6, 50, null,
    '{"downloadsPerMonth": 300, "anonDownloadsPerMonth": 0, "proTemplates": true, "saveConfigs": true,
      "watermark": false, "customLogo": true, "rateUpdates": true, "clientProfiles": 1,
      "whiteLabel": false, "batchDownload": false}',
    '["Todas las plantillas, incluidas las Pro (planilla, ISV, ISR, prestaciones…)",
      "Descargas sin límite razonable", "Guarda tus configuraciones y regenéralas en un clic",
      "Tu logo y sin marca de agua", "Aviso y regeneración cuando cambian las tasas"]',
    true, 2
  ),
  (
    'negocio', 'Negocio / Contador', 'Para contadores y empresas con varios clientes o sucursales.', 20, 200, null,
    '{"downloadsPerMonth": 2000, "anonDownloadsPerMonth": 0, "proTemplates": true, "saveConfigs": true,
      "watermark": false, "customLogo": true, "rateUpdates": true, "clientProfiles": 25,
      "whiteLabel": true, "batchDownload": true}',
    '["Todo lo de Pro", "Hasta 25 perfiles de cliente o empresa (logo, RTN y datos)",
      "Tu marca en los archivos en lugar de la nuestra", "Descarga por lote para varios clientes a la vez"]',
    false, 3
  ),
  (
    'compra-unica', 'Compra única', 'Una plantilla Pro sin suscripción.', null, null, 5,
    '{"accessDays": 7}',
    '["Una plantilla Pro", "7 días para corregir y volver a descargar"]',
    false, 4
  )
on conflict (code) do nothing;

-- Cupón de ejemplo: 20 % en el primer mes de Pro o Negocio, máximo 100 usos
insert into public.coupons (code, percent_off, max_redemptions, expires_at, applies_to, duration_months)
values ('LANZAMIENTO20', 20, 100, '2026-12-31 23:59:59-06', array['pro', 'negocio'], 1)
on conflict (code) do nothing;
