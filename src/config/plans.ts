/**
 * Valores POR DEFECTO de planes, precios y límites. En producción se leen de
 * la tabla `plans` de la base de datos (con estos valores como respaldo si
 * la base no está disponible). Los precios son marcadores de posición.
 */
export type PlanCode = "free" | "pro" | "negocio";
export type BillingCycle = "monthly" | "yearly";

export interface PlanLimits {
  /** Descargas por mes para cuentas (null = sin límite razonable) */
  downloadsPerMonth: number | null;
  /** Descargas por mes sin cuenta (solo plan gratis) */
  anonDownloadsPerMonth: number;
  proTemplates: boolean;
  saveConfigs: boolean;
  watermark: boolean;
  customLogo: boolean;
  rateUpdates: boolean;
  clientProfiles: number;
  whiteLabel: boolean;
  batchDownload: boolean;
}

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  tagline: string;
  priceMonthlyUsd: number | null;
  priceYearlyUsd: number | null;
  limits: PlanLimits;
  /** Beneficios que se muestran en la tarjeta del plan */
  features: string[];
  highlight?: boolean;
  sortOrder: number;
}

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    code: "free",
    name: "Gratis",
    tagline: "Para empezar y para lo básico del día a día.",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    sortOrder: 1,
    limits: {
      downloadsPerMonth: 5,
      anonDownloadsPerMonth: 3,
      proTemplates: false,
      saveConfigs: false,
      watermark: true,
      customLogo: false,
      rateUpdates: false,
      clientProfiles: 0,
      whiteLabel: false,
      batchDownload: false,
    },
    features: [
      "Todas las plantillas gratis",
      "5 descargas al mes con cuenta (3 sin cuenta)",
      "Fórmulas, validaciones e instrucciones",
      "Marca de agua sutil en la hoja de instrucciones",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    tagline: "Para negocios que usan sus plantillas todos los meses.",
    priceMonthlyUsd: 6,
    priceYearlyUsd: 50,
    sortOrder: 2,
    highlight: true,
    limits: {
      downloadsPerMonth: 300,
      anonDownloadsPerMonth: 0,
      proTemplates: true,
      saveConfigs: true,
      watermark: false,
      customLogo: true,
      rateUpdates: true,
      clientProfiles: 1,
      whiteLabel: false,
      batchDownload: false,
    },
    features: [
      "Todas las plantillas, incluidas las Pro (planilla, ISV, ISR, prestaciones…)",
      "Descargas sin límite razonable",
      "Guarda tus configuraciones y regenéralas en un clic",
      "Tu logo y sin marca de agua",
      "Aviso y regeneración cuando cambian las tasas",
    ],
  },
  {
    code: "negocio",
    name: "Negocio / Contador",
    tagline: "Para contadores y empresas con varios clientes o sucursales.",
    priceMonthlyUsd: 20,
    priceYearlyUsd: 200,
    sortOrder: 3,
    limits: {
      downloadsPerMonth: 2000,
      anonDownloadsPerMonth: 0,
      proTemplates: true,
      saveConfigs: true,
      watermark: false,
      customLogo: true,
      rateUpdates: true,
      clientProfiles: 25,
      whiteLabel: true,
      batchDownload: true,
    },
    features: [
      "Todo lo de Pro",
      "Hasta 25 perfiles de cliente o empresa (logo, RTN y datos)",
      "Tu marca en los archivos en lugar de la nuestra",
      "Descarga por lote para varios clientes a la vez",
    ],
  },
];

/** Compra única de una plantilla Pro (sin suscripción). */
export const DEFAULT_ONE_TIME = {
  code: "compra-unica",
  name: "Compra única",
  priceUsd: 5,
  /** Días de acceso a la plantilla comprada (para corregir y volver a descargar) */
  accessDays: 7,
};

export const BILLING_DEFAULTS = {
  /** Tipo de cambio de referencia USD → HNL (marcador; configurable por variable de entorno) */
  exchangeRateUsdHnl: Number(process.env.NEXT_PUBLIC_USD_HNL_RATE ?? 26.5),
  refundDays: Number(process.env.NEXT_PUBLIC_REFUND_DAYS ?? 7),
  refundText:
    process.env.NEXT_PUBLIC_REFUND_TEXT ??
    "Si Pro no te sirve, te devolvemos tu dinero dentro de los primeros 7 días. Sin preguntas.",
};

export function yearlySavings(
  plan: Pick<PlanDefinition, "priceMonthlyUsd" | "priceYearlyUsd">,
): number {
  if (!plan.priceMonthlyUsd || !plan.priceYearlyUsd) return 0;
  return Math.max(0, Math.round((1 - plan.priceYearlyUsd / (plan.priceMonthlyUsd * 12)) * 100));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);
}

export function formatHnl(usd: number, rate = BILLING_DEFAULTS.exchangeRateUsdHnl): string {
  return `L ${new Intl.NumberFormat("es-HN", { maximumFractionDigits: 0 }).format(usd * rate)}`;
}
