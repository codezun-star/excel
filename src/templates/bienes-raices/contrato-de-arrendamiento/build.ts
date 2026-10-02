import type ExcelJS from "exceljs";

import { amountInWordsRef } from "@/lib/excel/amount-in-words";
import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { formulaString } from "@/lib/excel/refs";
import { addSheet, protectSheet, setColumnWidths } from "@/lib/excel/sheet";
import { font, makeTheme, type SheetTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ContratoConfig } from "./form";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Texto literal partido en trozos (Excel no acepta cadenas de más de 255 caracteres en una fórmula). */
function lit(text: string): string {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += 200) parts.push(formulaString(text.slice(i, i + 200)));
  return parts.join("&");
}

/** Une trozos de texto (string) y expresiones ({ f }) en una sola fórmula de texto. */
function join(...parts: (string | { f: string })[]): string {
  return parts.map((p) => (typeof p === "string" ? lit(p) : `(${p.f})`)).join("&");
}

const monthName = (d: string) =>
  `CHOOSE(MONTH(${d}),${MONTH_NAMES.map((m) => `"${m}"`).join(",")})`;
const dateText = (d: string) => `DAY(${d})&" de "&${monthName(d)}&" de "&YEAR(${d})`;

/** Monto con separador de miles y dos decimales ("8,000.00") sin depender de la configuración regional. */
function amountDigits(cell: string): string {
  const x = `ROUND(N(${cell}),2)`;
  const int = `INT(${x})`;
  const thousands = `IF(${int}>=1000000,INT(${int}/1000000)&","&TEXT(INT(MOD(${int},1000000)/1000),"000")&","&TEXT(MOD(${int},1000),"000"),IF(${int}>=1000,INT(${int}/1000)&","&TEXT(MOD(${int},1000),"000"),${int}&""))`;
  return `${thousands}&"."&TEXT(ROUND((${x}-${int})*100,0),"00")`;
}

function firstOfNextMonth(): string {
  const d = new Date();
  const n = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return n.toISOString().slice(0, 10);
}

function paragraph(
  ws: ExcelJS.Worksheet,
  row: number,
  formula: string,
  estimate: number,
  theme: SheetTheme,
  opts: { bold?: boolean; size?: number; center?: boolean } = {},
) {
  ws.mergeCells(row, 1, row, 6);
  const c = ws.getCell(row, 1);
  c.value = { formula };
  c.font = font(theme, { bold: opts.bold, size: opts.size ?? 11 });
  c.alignment = { wrapText: true, vertical: "top", horizontal: opts.center ? "center" : "justify" };
  const lines = Math.max(1, Math.ceil(estimate / 92));
  ws.getRow(row).height = lines * 15 + 4;
}

export const build: TemplateBuild<ContratoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const ex = config.example;
  const wb = createWorkbook({
    title: titleWith("Contrato de arrendamiento", config.businessName),
    ctx,
    options,
  });
  const data = addSheet(wb, "Datos", { tabColor: theme.primary });
  const doc = addSheet(wb, "Contrato", { tabColor: theme.primary, showGridLines: false });
  const cal = addSheet(wb, "Calendario de pagos", { freezeRows: 9, tabColor: theme.primary });
  const inv = addSheet(wb, "Inventario", { freezeRows: 4, tabColor: theme.primary });

  const pick = (value: string, example: string) => value || (ex ? example : "");
  addSheetHeader(data, {
    title: titleWith("Datos del contrato", config.businessName),
    subtitle: "Llena o corrige estos datos: el contrato y el calendario se completan solos.",
    theme,
    width: 5,
  });
  const d = addFields(data, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 4,
    fields: [
      {
        key: "landlord",
        label: "Arrendador (dueño)",
        kind: "text",
        value: pick(config.landlord, "José Antonio Mejía Reyes"),
      },
      {
        key: "landlordId",
        label: "Identidad del arrendador",
        kind: "text",
        value: ex ? "0801-1975-01234" : undefined,
      },
      {
        key: "tenant",
        label: "Arrendatario (inquilino)",
        kind: "text",
        value: pick(config.tenant, "Karla Patricia Flores Díaz"),
      },
      {
        key: "tenantId",
        label: "Identidad del arrendatario",
        kind: "text",
        value: ex ? "0501-1990-05678" : undefined,
      },
      {
        key: "address",
        label: "Dirección del inmueble",
        kind: "text",
        value: pick(config.address, "Colonia Palmira, avenida República de Chile, casa 1520"),
      },
      {
        key: "use",
        label: "Uso del inmueble",
        kind: "list",
        list: ["vivienda", "local comercial", "oficina", "bodega"],
        value: config.use,
      },
      { key: "rent", label: "Renta mensual", kind: "currency", value: config.rent },
      { key: "deposit", label: "Depósito de garantía", kind: "currency", value: config.deposit },
      { key: "months", label: "Plazo (meses)", kind: "integer", value: config.months },
      {
        key: "start",
        label: "Fecha de inicio",
        kind: "date",
        value: config.start || firstOfNextMonth(),
      },
      {
        key: "end",
        label: "Fecha de vencimiento",
        kind: "calc",
        resultKind: "date",
        formula: (c) =>
          `IF(OR(${c("start")}="",${c("months")}=""),"",EDATE(${c("start")},${c("months")})-1)`,
      },
      { key: "payDay", label: "Día límite de pago", kind: "integer", value: config.payDay },
      {
        key: "method",
        label: "Forma de pago",
        kind: "text",
        value: "depósito o transferencia a la cuenta bancaria que indique EL ARRENDADOR",
      },
      {
        key: "services",
        label: "Servicios públicos a cargo de",
        kind: "list",
        list: ["EL ARRENDATARIO", "EL ARRENDADOR"],
        value: "EL ARRENDATARIO",
      },
      {
        key: "notice",
        label: "Días de aviso para terminar",
        kind: "integer",
        value: config.noticeDays,
      },
      { key: "city", label: "Ciudad donde se firma", kind: "text", value: config.city },
      {
        key: "sign",
        label: "Fecha de firma",
        kind: "date",
        value: config.start || firstOfNextMonth(),
      },
      {
        key: "extra",
        label: "Cláusula adicional (opcional)",
        kind: "text",
        value: ex
          ? "Se permite una mascota pequeña; EL ARRENDATARIO responde por los daños que cause."
          : undefined,
      },
    ],
    theme,
    ctx,
  });
  data.getColumn(1).width = 30;
  setColumnWidths(data, [30, 16, 16, 16, 16]);
  const note = data.getCell(d.nextRow + 1, 1);
  note.value =
    "Este es un modelo orientativo. Revisa las cláusulas con un abogado o notario antes de firmar y adáptalas a tu caso.";
  note.font = font(theme, { italic: true, size: 10, color: theme.muted });
  data.mergeCells(d.nextRow + 1, 1, d.nextRow + 1, 6);

  const R = (k: string) => d.ref(k);
  const sym = ctx.currency.symbol;
  const rentWords = amountInWordsRef(wb, R("rent"), ctx);
  const depWords = amountInWordsRef(wb, R("deposit"), ctx);
  const money = (cell: string, words: string) => `${words}&" (${sym} "&${amountDigits(cell)}&")"`;

  // Contrato imprimible
  setColumnWidths(doc, [16, 16, 16, 16, 16, 16]);
  paragraph(doc, 1, `"CONTRATO DE ARRENDAMIENTO"`, 10, theme, {
    bold: true,
    size: 14,
    center: true,
  });
  paragraph(doc, 2, `"DE "&UPPER(${R("use")})`, 10, theme, { bold: true, center: true });
  let row = 4;
  const clauses: [string, number][] = [
    [
      join(
        "Nosotros, ",
        { f: R("landlord") },
        ", mayor de edad, con documento de identidad número ",
        { f: R("landlordId") },
        ", quien en adelante se denominará EL ARRENDADOR, y ",
        { f: R("tenant") },
        ", mayor de edad, con documento de identidad número ",
        { f: R("tenantId") },
        ", quien en adelante se denominará EL ARRENDATARIO, hemos convenido en celebrar el presente contrato de arrendamiento, que se regirá por las cláusulas siguientes:",
      ),
      420,
    ],
    [
      join(
        "PRIMERA — OBJETO. EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO el inmueble ubicado en ",
        { f: R("address") },
        ", que será destinado exclusivamente para ",
        { f: R("use") },
        ". EL ARRENDATARIO declara recibirlo en el estado descrito en el inventario anexo, que forma parte de este contrato.",
      ),
      330,
    ],
    [
      join(
        "SEGUNDA — PLAZO. El plazo del arrendamiento es de ",
        { f: R("months") },
        { f: `IF(${R("months")}=1," mes"," meses")` },
        ", contado a partir del ",
        { f: dateText(R("start")) },
        " y con vencimiento el ",
        { f: dateText(R("end")) },
        ". El plazo podrá prorrogarse por acuerdo escrito entre las partes.",
      ),
      260,
    ],
    [
      join(
        "TERCERA — RENTA. La renta mensual es de ",
        { f: money(R("rent"), rentWords) },
        ", que EL ARRENDATARIO pagará por mes adelantado a más tardar el día ",
        { f: R("payDay") },
        " de cada mes, mediante ",
        { f: R("method") },
        ".",
      ),
      330,
    ],
    [
      `IF(N(${R("deposit")})=0,${lit("CUARTA — DEPÓSITO. Las partes acuerdan que no se entrega depósito de garantía.")},${join("CUARTA — DEPÓSITO. Al firmar este contrato EL ARRENDATARIO entrega la cantidad de ", { f: money(R("deposit"), depWords) }, " como depósito de garantía, que le será devuelto al terminar el arrendamiento una vez verificado el buen estado del inmueble y el pago total de rentas y servicios. El depósito no podrá aplicarse al pago de la última renta sin el consentimiento de EL ARRENDADOR.")})`,
      440,
    ],
    [
      join(
        "QUINTA — SERVICIOS PÚBLICOS. El pago de energía eléctrica, agua potable, internet y demás servicios del inmueble correrá por cuenta de ",
        { f: R("services") },
        " durante la vigencia de este contrato.",
      ),
      200,
    ],
    [
      lit(
        "SEXTA — CONSERVACIÓN Y MEJORAS. EL ARRENDATARIO se obliga a cuidar el inmueble, a no subarrendarlo ni cederlo sin autorización escrita de EL ARRENDADOR y a no hacer modificaciones sin su permiso. Las reparaciones locativas menores serán por cuenta de EL ARRENDATARIO y las reparaciones mayores o estructurales por cuenta de EL ARRENDADOR. Al terminar el contrato EL ARRENDATARIO devolverá el inmueble en el estado en que lo recibió, salvo el desgaste normal por el uso.",
      ),
      470,
    ],
    [
      join(
        "SÉPTIMA — TERMINACIÓN. Cualquiera de las partes podrá dar por terminado este contrato antes de su vencimiento dando aviso por escrito con ",
        { f: R("notice") },
        " días de anticipación. La falta de pago de la renta o el incumplimiento de cualquiera de las cláusulas dará derecho a la otra parte a pedir la terminación del contrato conforme a la ley.",
      ),
      360,
    ],
    [`IF(${R("extra")}="","",${join("OCTAVA — OTROS ACUERDOS. ", { f: R("extra") })})`, 200],
    [
      join(
        { f: `IF(${R("extra")}="","OCTAVA","NOVENA")` },
        ` — ACEPTACIÓN. Ambas partes aceptan el contenido de este contrato y para lo no previsto se someten a las leyes de ${ctx.name}. En fe de lo cual firmamos dos ejemplares de igual valor en la ciudad de `,
        { f: R("city") },
        ", a los ",
        { f: `DAY(${R("sign")})` },
        " días del mes de ",
        { f: monthName(R("sign")) },
        " de ",
        { f: `YEAR(${R("sign")})` },
        ".",
      ),
      300,
    ],
  ];
  for (const [formula, estimate] of clauses) {
    paragraph(doc, row, formula, estimate, theme);
    row += 2;
  }
  row += 3;
  for (const [col, who, ref] of [
    [1, "EL ARRENDADOR", R("landlord")],
    [4, "EL ARRENDATARIO", R("tenant")],
  ] as const) {
    doc.mergeCells(row, col, row, col + 2);
    const line = doc.getCell(row, col);
    line.value = "______________________________";
    line.alignment = { horizontal: "center" };
    for (const [offset, formula, bold] of [
      [1, ref, true],
      [2, `"${who}"`, false],
    ] as const) {
      doc.mergeCells(row + offset, col, row + offset, col + 2);
      const c = doc.getCell(row + offset, col);
      c.value = { formula };
      c.font = font(theme, { bold });
      c.alignment = { horizontal: "center" };
    }
  }

  // Calendario de pagos del plazo
  addSheetHeader(cal, {
    title: "Calendario de pagos",
    subtitle: "Anota la fecha y el monto de cada pago recibido.",
    theme,
    width: 8,
  });
  const MONTHS = R("months");
  const table = addTable(cal, {
    startRow: 9,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 6,
        align: "center",
        formula: (r) => `IF(${r.index + 1}>N(${MONTHS}),"",${r.index + 1})`,
      },
      {
        key: "period",
        header: "Mes que cubre",
        kind: "formula",
        resultKind: "date",
        width: 14,
        formula: (r) => `IF(${r.c("n")}="","",EDATE(${R("start")},${r.index}))`,
      },
      {
        key: "due",
        header: "Fecha límite",
        kind: "formula",
        resultKind: "date",
        width: 13,
        formula: (r) =>
          `IF(${r.c("n")}="","",MAX(${r.c("period")},DATE(YEAR(${r.c("period")}),MONTH(${r.c("period")}),${R("payDay")})))`,
      },
      {
        key: "rent",
        header: "Renta",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("n")}="","",${R("rent")})`,
      },
      { key: "paidOn", header: "Fecha de pago", kind: "date", width: 13 },
      { key: "paid", header: "Monto pagado", kind: "currency", width: 13, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("n")}="","",${r.c("rent")}-${r.c("paid")})`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(${r.c("n")}="","",IF(${r.c("paid")}>=${r.c("rent")},"Pagado",IF(TODAY()>${r.c("due")},"Vencido","Pendiente")))`,
      },
    ],
    rows: 60,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex ? [{ paidOn: config.start || firstOfNextMonth(), paid: config.rent }] : undefined,
  });
  const S = table.letter("status");
  highlightWhen(
    cal,
    `A${table.firstRow}:${S}${table.lastRow}`,
    `$${S}${table.firstRow}="Vencido"`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    cal,
    `${S}${table.firstRow}:${S}${table.lastRow}`,
    `${S}${table.firstRow}="Pagado"`,
    { fill: theme.okSoft, bold: true },
    2,
  );
  addFields(cal, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    valueSpan: 2,
    fields: [
      {
        key: "tenant",
        label: "Arrendatario",
        kind: "calc",
        resultKind: "text",
        formula: () => R("tenant"),
      },
      {
        key: "total",
        label: "Valor total del contrato",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("rent"),
      },
      {
        key: "paid",
        label: "Pagado a la fecha",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("paid"),
      },
      {
        key: "late",
        label: "Saldo vencido",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `SUMIFS(${table.range("balance")},${table.range("status")},"Vencido")`,
      },
    ],
    theme,
    ctx,
  });

  // Inventario del inmueble
  addSheetHeader(inv, {
    title: "Inventario del inmueble",
    subtitle: "Estado de cada elemento al entregar y al devolver.",
    theme,
    width: 5,
  });
  const ITEMS = [
    "Llaves de la puerta principal",
    "Puertas y cerraduras",
    "Ventanas y vidrios",
    "Paredes y pintura",
    "Pisos",
    "Lámparas y tomacorrientes",
    "Lavamanos, inodoro y ducha",
    "Pila o lavadero",
    "Cocina y gabinetes",
    "Medidor de energía (lectura)",
    "Medidor de agua (lectura)",
  ];
  addTable(inv, {
    startRow: 4,
    columns: [
      { key: "item", header: "Elemento", kind: "text", width: 30 },
      { key: "qty", header: "Cantidad", kind: "integer", width: 10 },
      {
        key: "in",
        header: "Al entregar",
        kind: "list",
        width: 13,
        list: ["Bueno", "Regular", "Malo"],
        align: "center",
      },
      {
        key: "out",
        header: "Al devolver",
        kind: "list",
        width: 13,
        list: ["Bueno", "Regular", "Malo"],
        align: "center",
      },
      { key: "note", header: "Observaciones", kind: "text", width: 34 },
    ],
    rows: 40,
    theme,
    ctx,
    example: ITEMS.map((item, i) => ({
      item,
      qty: i === 0 ? 2 : undefined,
      in: ex ? "Bueno" : undefined,
    })),
  });

  for (const w of [data, doc, cal, inv]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Contrato de arrendamiento",
    description:
      "Prepara el contrato de alquiler, imprímelo y lleva el control de los pagos del plazo.",
    steps: [
      "En Datos escribe los nombres y números de identidad de las partes, la dirección y las condiciones del alquiler.",
      "Revisa la hoja Contrato: las cláusulas se completan solas y la renta aparece en letras.",
      "Imprime el Contrato y el Inventario y fírmenlos en dos ejemplares.",
      "Cada mes anota el pago en Calendario de pagos; los atrasados se marcan como Vencido.",
    ],
    tips: [
      "Es un modelo orientativo: revísalo con un abogado o notario antes de firmar.",
      "Toma fotos del inmueble el día de la entrega y guárdalas con el inventario.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
