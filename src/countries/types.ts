/**
 * Contrato que debe cumplir cada país. Las plantillas NUNCA escriben tasas,
 * techos ni porcentajes legales: todo lo leen de un CountryContext.
 */

export type CountryCode = "HN" | "GT" | "SV" | "NI" | "CR" | "PA" | "DO" | "MX" | "CO";

export type CountrySlug = Lowercase<CountryCode>;

export interface CurrencyInfo {
  /** Código ISO 4217 */
  code: string;
  /** Símbolo usado en formatos de Excel y en la interfaz */
  symbol: string;
  /** Locale para Intl.NumberFormat */
  locale: string;
  /** Nombre de la moneda para montos en letras */
  name: { singular: string; plural: string };
  /** Fracción para montos en letras ("CENTAVOS") */
  minorUnitName: { singular: string; plural: string };
  decimals: number;
  /** Denominaciones de billetes y monedas (para arqueos de caja) */
  denominations: { bills: number[]; coins: number[] };
}

export interface TaxIdInfo {
  /** Nombre corto del identificador tributario (RTN, NIT, RUC…) */
  name: string;
  description: string;
  /** Expresión regular (como texto) para validar el formato */
  pattern: string;
  placeholder: string;
  /** Documento de identidad personal (DNI, DPI, cédula…) */
  personalIdName: string;
}

export interface SalesTaxRate {
  id: "standard" | "special" | "exempt" | "exonerated";
  /** Etiqueta que aparece en los desplegables de Excel */
  label: string;
  rate: number;
  description: string;
}

export interface SalesTaxInfo {
  /** Nombre del impuesto (ISV en HN, IVA en otros países) */
  name: string;
  longName: string;
  rates: SalesTaxRate[];
  /** Día del mes siguiente en que vence la declaración mensual */
  filingDueDay: number;
  filingFormName: string;
}

export interface IncomeTaxBracket {
  /** Límite inferior anual (inclusive) */
  from: number;
  /** Límite superior anual (inclusive). null = sin límite */
  to: number | null;
  rate: number;
}

export interface IncomeTaxInfo {
  name: string;
  /** Tabla progresiva anual para personas naturales asalariadas */
  brackets: IncomeTaxBracket[];
  /** Deducciones anuales permitidas sin comprobación (p. ej. gastos médicos) */
  standardDeductions: { id: string; label: string; amount: number }[];
  fiscalYear: number;
  annualFilingDeadline: string;
  /** Retención mensual en planilla */
  withholding: {
    /** Meses de salario que se proyectan para estimar la renta anual */
    projectionMonths: number;
  };
}

export interface SocialSecurityItem {
  id: string;
  label: string;
  employeeRate: number;
  employerRate: number;
  /** Techo mensual de cotización (null = sin techo) */
  ceiling: number | null;
  /**
   * "upToCeiling": se cotiza sobre el salario hasta el techo.
   * "aboveCeiling": se cotiza solo sobre el excedente del techo (p. ej. RAP).
   * "full": sobre todo el salario.
   */
  base: "upToCeiling" | "aboveCeiling" | "full";
  /** Techo de referencia para "aboveCeiling" (normalmente el del IHSS) */
  referenceCeiling?: number | null;
  institution: string;
}

export interface MinimumWageRow {
  id: string;
  sector: string;
  /** Salario mínimo mensual por tamaño de empresa. null = pendiente de cargar */
  monthly: { size: string; amount: number | null }[];
}

export interface OvertimeRule {
  id: string;
  label: string;
  /** Recargo sobre el valor de la hora ordinaria (0.25 = 25 %) */
  surcharge: number;
}

export interface SeniorityStep {
  /** Antigüedad mínima en meses (inclusive) */
  fromMonths: number;
  value: number;
  unit: "days" | "weeks" | "months";
  label: string;
}

export interface LaborRules {
  /** Días base para cálculos proporcionales (360 o 365) */
  dayBasis: number;
  workdays: {
    day: { hoursPerDay: number; hoursPerWeek: number };
    night: { hoursPerDay: number; hoursPerWeek: number };
    mixed: { hoursPerDay: number; hoursPerWeek: number };
  };
  overtime: OvertimeRule[];
  /** Aguinaldo / décimo tercer mes */
  thirteenthMonth: {
    label: string;
    periodStart: { month: number; day: number };
    periodEnd: { month: number; day: number };
    paymentDeadline: string;
  };
  /** Décimo cuarto mes */
  fourteenthMonth: {
    label: string;
    periodStart: { month: number; day: number };
    periodEnd: { month: number; day: number };
    paymentDeadline: string;
  };
  /** Días de vacaciones por antigüedad (en años cumplidos) */
  vacationDays: { fromYears: number; days: number }[];
  /** Preaviso por antigüedad */
  noticePeriod: SeniorityStep[];
  /** Auxilio de cesantía */
  severance: {
    /** Tramos para antigüedad menor a un año */
    underOneYear: SeniorityStep[];
    /** Meses de salario por año trabajado */
    monthsPerYear: number;
    /** Máximo de meses a pagar */
    maxMonths: number;
  };
  /** Qué prestaciones corresponden según el motivo de terminación */
  terminationReasons: { id: string; label: string; notice: boolean; severance: boolean }[];
  minimumWage: {
    agreement: string;
    effectiveFrom: string;
    /** Salario mínimo promedio (usado para fines fiscales) */
    averageMonthly: number;
    companySizes: string[];
    table: MinimumWageRow[];
  };
}

export interface OfficialSource {
  name: string;
  url: string;
}

export interface CountryContext {
  code: CountryCode;
  slug: CountrySlug;
  name: string;
  /** Locale de la interfaz y de los formatos (es-HN) */
  locale: string;
  /** Etiqueta hreflang para SEO */
  hreflang: string;
  timeZone: string;
  currency: CurrencyInfo;
  taxId: TaxIdInfo;
  taxes: {
    salesTax: SalesTaxInfo;
    incomeTax: IncomeTaxInfo;
    socialSecurity: SocialSecurityItem[];
    /** Aportes patronales adicionales (INFOP, reserva laboral, etc.) */
    employerOnly: { id: string; label: string; rate: number; institution: string }[];
  };
  labor: LaborRules;
  /** Datos para documentos fiscales (facturas) */
  invoicing: {
    authorizationCodeName: string;
    authorizationCodeDescription: string;
    numberFormatHint: string;
    defaultPrefix: string;
    /** Prefijos sugeridos por tipo de documento fiscal */
    documentPrefixes: { invoice: string; creditNote: string; debitNote: string; receipt: string };
    correlativeDigits: number;
    /** Leyendas que deben aparecer en el documento fiscal */
    legends: string[];
    /** Campos adicionales para compras de clientes exonerados */
    exemptionFields: string[];
  };
  /**
   * Versión de las reglas del país. Cambiarla cuando se actualice cualquier
   * valor legal: las configuraciones guardadas con una versión anterior
   * mostrarán el aviso "Hay una versión más reciente de tu plantilla".
   */
  rulesVersion: string;
  /** Fecha de la última revisión humana de los valores (AAAA-MM-DD) */
  lastReviewed: string;
  /**
   * "pending" mientras los valores no hayan sido confirmados con fuentes
   * oficiales. La interfaz muestra un aviso visible hasta que sea "verified".
   */
  reviewStatus: "pending" | "verified";
  sources: OfficialSource[];
}

export interface CountryEntry {
  code: CountryCode;
  slug: CountrySlug;
  name: string;
  status: "active" | "coming-soon";
}
