import type { CountryContext } from "./types";

/**
 * Reglas de Honduras.
 *
 * IMPORTANTE: todos los valores fiscales y laborales se recopilaron de fuentes
 * secundarias (prensa y guías) en octubre de 2026 y DEBEN confirmarse con las
 * publicaciones oficiales (La Gaceta, SAR, STSS, IHSS, RAP) antes de publicar.
 * Mientras `reviewStatus` sea "pending", el sitio muestra un aviso visible en
 * cada plantilla fiscal o laboral.
 *
 * Cuando cambies cualquier valor: actualiza `rulesVersion` y `lastReviewed`.
 */
export const HN: CountryContext = {
  code: "HN",
  slug: "hn",
  name: "Honduras",
  locale: "es-HN",
  hreflang: "es-HN",
  timeZone: "America/Tegucigalpa",

  currency: {
    code: "HNL",
    symbol: "L",
    locale: "es-HN",
    name: { singular: "LEMPIRA", plural: "LEMPIRAS" },
    minorUnitName: { singular: "CENTAVO", plural: "CENTAVOS" },
    decimals: 2,
    denominations: {
      bills: [500, 200, 100, 50, 20, 10, 5, 2, 1],
      coins: [0.5, 0.2, 0.1, 0.05],
    },
  },

  taxId: {
    name: "RTN",
    description: "Registro Tributario Nacional (14 dígitos)",
    // Acepta 14 dígitos con o sin guiones: 0801-1990-123456 o 08011990123456
    pattern: "^\\d{4}-?\\d{4}-?\\d{6}$",
    placeholder: "0801-1990-123456",
    personalIdName: "DNI",
  },

  taxes: {
    salesTax: {
      name: "ISV",
      longName: "Impuesto Sobre Ventas",
      rates: [
        {
          id: "standard",
          label: "ISV 15%",
          rate: 0.15, // TODO: VERIFICAR VALOR VIGENTE (tasa general, Ley del ISV)
          description: "Tasa general para bienes y servicios gravados",
        },
        {
          id: "special",
          label: "ISV 18%",
          rate: 0.18, // TODO: VERIFICAR VALOR VIGENTE (bebidas alcohólicas, tabaco, boletos aéreos clase ejecutiva)
          description: "Bebidas alcohólicas, cigarrillos y boletos aéreos en clase ejecutiva",
        },
        {
          id: "exempt",
          label: "Exento",
          rate: 0, // TODO: VERIFICAR VALOR VIGENTE
          description: "Bienes y servicios exentos según la Ley del ISV",
        },
      ],
      filingDueDay: 10, // TODO: VERIFICAR VALOR VIGENTE (declaración mensual ISV, Formulario 222)
      filingFormName: "Declaración Mensual del ISV (Formulario SAR-222)",
    },

    incomeTax: {
      name: "ISR",
      fiscalYear: 2026,
      // TODO: VERIFICAR VALOR VIGENTE — Tabla progresiva 2026 publicada por el SAR (7 de enero de 2026)
      brackets: [
        { from: 0, to: 228_324.32, rate: 0 },
        { from: 228_324.33, to: 348_154.1, rate: 0.15 },
        { from: 348_154.11, to: 809_660.75, rate: 0.2 },
        { from: 809_660.76, to: null, rate: 0.25 },
      ],
      standardDeductions: [
        {
          id: "medical",
          label: "Gastos médicos (sin comprobación)",
          amount: 40_000, // TODO: VERIFICAR VALOR VIGENTE
        },
      ],
      annualFilingDeadline: "30 de abril", // TODO: VERIFICAR VALOR VIGENTE
    },

    socialSecurity: [
      {
        id: "ihss-em",
        label: "IHSS Enfermedad y Maternidad",
        employeeRate: 0.025, // TODO: VERIFICAR VALOR VIGENTE
        employerRate: 0.05, // TODO: VERIFICAR VALOR VIGENTE
        ceiling: 11_903.13, // TODO: VERIFICAR VALOR VIGENTE (techo 2026)
        base: "upToCeiling",
        institution: "IHSS",
      },
      {
        id: "ihss-ivm",
        label: "IHSS Invalidez, Vejez y Muerte",
        employeeRate: 0.025, // TODO: VERIFICAR VALOR VIGENTE
        employerRate: 0.035, // TODO: VERIFICAR VALOR VIGENTE
        ceiling: 11_903.13, // TODO: VERIFICAR VALOR VIGENTE (techo 2026)
        base: "upToCeiling",
        institution: "IHSS",
      },
      {
        id: "ihss-rp",
        label: "IHSS Riesgos Profesionales",
        employeeRate: 0,
        employerRate: 0.002, // TODO: VERIFICAR VALOR VIGENTE
        ceiling: 11_903.13, // TODO: VERIFICAR VALOR VIGENTE
        base: "upToCeiling",
        institution: "IHSS",
      },
      {
        id: "rap",
        label: "RAP (aportación sobre excedente del techo IHSS)",
        employeeRate: 0.015, // TODO: VERIFICAR VALOR VIGENTE
        employerRate: 0.015, // TODO: VERIFICAR VALOR VIGENTE
        ceiling: null,
        base: "aboveCeiling",
        referenceCeiling: 11_903.13, // TODO: VERIFICAR VALOR VIGENTE
        institution: "RAP",
      },
    ],

    employerOnly: [
      { id: "infop", label: "INFOP", rate: 0.01, institution: "INFOP" }, // TODO: VERIFICAR VALOR VIGENTE
      {
        id: "reserva-laboral",
        label: "Reserva laboral de capitalización (RAP)",
        rate: 0.04, // TODO: VERIFICAR VALOR VIGENTE
        institution: "RAP",
      },
    ],
  },

  labor: {
    dayBasis: 360, // TODO: VERIFICAR VALOR VIGENTE (base usada para proporcionales)
    workdays: {
      // TODO: VERIFICAR VALOR VIGENTE (Código de Trabajo, arts. 322-326)
      day: { hoursPerDay: 8, hoursPerWeek: 44 },
      night: { hoursPerDay: 6, hoursPerWeek: 36 },
      mixed: { hoursPerDay: 7, hoursPerWeek: 42 },
    },
    // TODO: VERIFICAR VALOR VIGENTE (Código de Trabajo, art. 330)
    overtime: [
      { id: "diurna", label: "Extra diurna", surcharge: 0.25 },
      { id: "nocturna", label: "Extra en jornada nocturna", surcharge: 0.5 },
      { id: "prolongacion-nocturna", label: "Prolongación de jornada nocturna", surcharge: 0.75 },
    ],
    thirteenthMonth: {
      label: "Décimo tercer mes (aguinaldo)",
      periodStart: { month: 1, day: 1 }, // TODO: VERIFICAR VALOR VIGENTE
      periodEnd: { month: 12, day: 31 },
      paymentDeadline: "Diciembre", // TODO: VERIFICAR VALOR VIGENTE
    },
    fourteenthMonth: {
      label: "Décimo cuarto mes",
      periodStart: { month: 7, day: 1 }, // TODO: VERIFICAR VALOR VIGENTE (1 de julio del año anterior)
      periodEnd: { month: 6, day: 30 },
      paymentDeadline: "Junio", // TODO: VERIFICAR VALOR VIGENTE
    },
    // TODO: VERIFICAR VALOR VIGENTE (Código de Trabajo, art. 346 — días hábiles)
    vacationDays: [
      { fromYears: 1, days: 10 },
      { fromYears: 2, days: 12 },
      { fromYears: 3, days: 15 },
      { fromYears: 4, days: 20 },
    ],
    // TODO: VERIFICAR VALOR VIGENTE (Código de Trabajo, art. 116)
    noticePeriod: [
      { fromMonths: 0, value: 1, unit: "days", label: "24 horas" },
      { fromMonths: 3, value: 1, unit: "weeks", label: "1 semana" },
      { fromMonths: 6, value: 2, unit: "weeks", label: "2 semanas" },
      { fromMonths: 12, value: 1, unit: "months", label: "1 mes" },
      { fromMonths: 24, value: 2, unit: "months", label: "2 meses" },
    ],
    // TODO: VERIFICAR VALOR VIGENTE (Código de Trabajo, art. 120)
    severance: {
      underOneYear: [
        { fromMonths: 0, value: 0, unit: "days", label: "Sin cesantía" },
        { fromMonths: 3, value: 10, unit: "days", label: "10 días de salario" },
        { fromMonths: 6, value: 20, unit: "days", label: "20 días de salario" },
      ],
      monthsPerYear: 1,
      maxMonths: 25,
    },
    minimumWage: {
      agreement: "Acuerdo Ejecutivo SETRASS-233-2026", // TODO: VERIFICAR VALOR VIGENTE
      effectiveFrom: "2026-01-01", // TODO: VERIFICAR VALOR VIGENTE
      averageMonthly: 14_917.2, // TODO: VERIFICAR VALOR VIGENTE (Comunicado SAR-19-2026)
      companySizes: ["1 a 10", "11 a 50", "51 a 150", "151 o más"],
      // TODO: VERIFICAR VALOR VIGENTE — Completar con la tabla oficial de la STSS.
      // Los valores null aún no se han cargado y se muestran como "Por verificar".
      table: [
        {
          id: "agricultura",
          sector: "Agricultura, silvicultura, caza y pesca",
          monthly: [
            { size: "1 a 10", amount: 9_596.64 },
            { size: "11 a 50", amount: 10_137.04 },
            { size: "51 a 150", amount: 11_313.45 },
            { size: "151 o más", amount: 12_349.49 },
          ],
        },
        {
          id: "minas",
          sector: "Explotación de minas y canteras",
          monthly: [
            { size: "1 a 10", amount: 13_110.8 },
            { size: "11 a 50", amount: 13_527.23 },
            { size: "51 a 150", amount: 16_248.28 },
            { size: "151 o más", amount: 18_530.19 },
          ],
        },
        {
          id: "manufactura",
          sector: "Industria manufacturera",
          monthly: [
            { size: "1 a 10", amount: 13_641.28 },
            { size: "11 a 50", amount: null },
            { size: "51 a 150", amount: null },
            { size: "151 o más", amount: null },
          ],
        },
        {
          id: "electricidad",
          sector: "Electricidad, gas y agua",
          monthly: [
            { size: "1 a 10", amount: 13_533.74 },
            { size: "11 a 50", amount: 13_963.55 },
            { size: "51 a 150", amount: 16_772.4 },
            { size: "151 o más", amount: 19_127.95 },
          ],
        },
        {
          id: "construccion",
          sector: "Construcción",
          monthly: [
            { size: "1 a 10", amount: 13_292.06 },
            { size: "11 a 50", amount: null },
            { size: "51 a 150", amount: null },
            { size: "151 o más", amount: null },
          ],
        },
        {
          id: "comercio",
          sector: "Comercio al por mayor y menor, restaurantes y hoteles",
          monthly: [
            { size: "1 a 10", amount: 13_292.06 },
            { size: "11 a 50", amount: null },
            { size: "51 a 150", amount: null },
            { size: "151 o más", amount: null },
          ],
        },
        {
          id: "transporte",
          sector: "Transporte, almacenamiento y comunicaciones",
          monthly: [
            { size: "1 a 10", amount: 13_412.92 },
            { size: "11 a 50", amount: 13_838.87 },
            { size: "51 a 150", amount: 16_622.64 },
            { size: "151 o más", amount: 18_957.14 },
          ],
        },
        {
          id: "financieros",
          sector: "Establecimientos financieros, seguros, bienes inmuebles y servicios a empresas",
          monthly: [
            { size: "1 a 10", amount: 13_654.55 },
            { size: "11 a 50", amount: null },
            { size: "51 a 150", amount: null },
            { size: "151 o más", amount: 19_298.72 },
          ],
        },
        {
          id: "servicios",
          sector: "Servicios comunales, sociales y personales",
          monthly: [
            { size: "1 a 10", amount: 13_050.39 },
            { size: "11 a 50", amount: null },
            { size: "51 a 150", amount: null },
            { size: "151 o más", amount: null },
          ],
        },
      ],
    },
  },

  invoicing: {
    authorizationCodeName: "CAI",
    authorizationCodeDescription: "Código de Autorización de Impresión emitido por el SAR",
    numberFormatHint: "000-001-01-00000001 (establecimiento-punto de emisión-tipo-correlativo)",
    defaultPrefix: "000-001-01-",
    // TODO: VERIFICAR VALOR VIGENTE (códigos de tipo de documento del régimen de facturación)
    documentPrefixes: {
      invoice: "000-001-01-",
      creditNote: "000-001-04-",
      debitNote: "000-001-05-",
      receipt: "000-001-03-",
    },
    correlativeDigits: 8,
    // TODO: VERIFICAR VALOR VIGENTE (Reglamento del Régimen de Facturación, SAR)
    legends: [
      "Original: Cliente · Copia: Obligado tributario emisor",
      "La factura es beneficio de todos. ¡Exíjala!",
    ],
    // TODO: VERIFICAR VALOR VIGENTE
    exemptionFields: [
      "N.º correlativo de orden de compra exenta",
      "N.º correlativo de constancia de registro de exonerado",
      "N.º identificativo del registro de la SAG",
    ],
  },

  rulesVersion: "HN-2026.1",
  lastReviewed: "2026-10-01", // TODO: VERIFICAR VALOR VIGENTE — fecha de recopilación, no de verificación oficial
  reviewStatus: "pending",
  sources: [
    { name: "SAR — Servicio de Administración de Rentas", url: "https://www.sar.gob.hn" },
    { name: "Secretaría de Trabajo y Seguridad Social", url: "https://www.trabajo.gob.hn" },
    { name: "IHSS — Instituto Hondureño de Seguridad Social", url: "https://www.ihss.hn" },
    { name: "RAP — Régimen de Aportaciones Privadas", url: "https://www.rap.hn" },
  ],
};
