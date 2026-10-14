import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange, ifLabel } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { RetencionesConfig } from "./form";

const MADE = "Efectuada";
const RECEIVED = "Recibida";
/** Filas libres en Parámetros para conceptos propios */
const SPARE_CONCEPTS = 4;

export const build: TemplateBuild<RetencionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const w = ctx.taxes.withholding;
  const isr = ctx.taxes.incomeTax.name;
  const isv = ctx.taxes.salesTax.name;
  const title = titleWith("Control de retenciones", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Retenciones", {
    freezeRows: 9,
    landscape: true,
    tabColor: theme.primary,
  });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Año y vencimiento",
        rows: [
          { key: "year", label: "Año del control", value: config.year, kind: "integer" },
          {
            key: "dueDay",
            label: "Día para enterar lo retenido (mes siguiente)",
            value: w.remittanceDueDay,
            kind: "integer",
          },
        ],
      },
    ],
    tables: [
      {
        key: "rules",
        title: "Conceptos de retención",
        columns: [
          { header: "Concepto", kind: "text" },
          { header: "Impuesto", kind: "text" },
          { header: "Tasa", kind: "percent" },
          { header: "Se calcula sobre", kind: "text" },
        ],
        rows: [
          ...w.rules.map((r) => [r.label, r.tax === "income" ? isr : isv, r.rate, r.base]),
          ...Array.from({ length: SPARE_CONCEPTS }, () => [null, null, null, null]),
        ],
        note: `Para un concepto propio usa una fila vacía: escribe el concepto, el impuesto (${isr} o ${isv}) y la tasa.`,
      },
    ],
  });
  const rules = params.table("rules");
  const dueDay = params.ref("dueDay");
  const conceptOf = (id: string) => w.rules.find((r) => r.id === id)?.label ?? null;

  addSheetHeader(ws, {
    title,
    subtitle: `${config.taxId ? `${ctx.taxId.name} ${config.taxId} · ` : ""}Efectuada: tú retuviste y debes enterarla al SAR · Recibida: te retuvieron y es un crédito a tu favor.`,
    theme,
    width: 14,
  });
  const ex = config.example;
  const y = config.year;
  const table = addTable(ws, {
    startRow: 9,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 11 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 11,
        list: [MADE, RECEIVED],
        align: "center",
        note: `${MADE}: la retuviste tú a un proveedor. ${RECEIVED}: te la retuvo un cliente.`,
      },
      { key: "party", header: "Proveedor o cliente", kind: "text", width: 28 },
      { key: "partyId", header: ctx.taxId.name, kind: "text", width: 17 },
      { key: "doc", header: "Factura o documento", kind: "text", width: 20 },
      {
        key: "concept",
        header: "Concepto",
        kind: "list",
        width: 34,
        list: { source: params.tableColumn("rules", 0) },
      },
      {
        key: "tax",
        header: "Impuesto",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) =>
          `IF(${r.c("concept")}="","",IFERROR(VLOOKUP(${r.c("concept")},${rules},2,0),""))`,
      },
      {
        key: "base",
        header: "Base",
        kind: "currency",
        width: 14,
        total: "sum",
        note: "Monto sin impuesto sobre el que se calcula la retención.",
      },
      {
        key: "rate",
        header: "Tasa",
        kind: "formula",
        resultKind: "percent",
        width: 8,
        align: "center",
        formula: (r) =>
          `IF(${r.c("concept")}="","",IFERROR(VLOOKUP(${r.c("concept")},${rules},3,0),0))`,
      },
      {
        key: "amount",
        header: "Retención",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("base")}="",${r.c("rate")}=""),"",ROUND(${r.c("base")}*${r.c("rate")},2))`,
      },
      { key: "cert", header: "N.º de constancia", kind: "text", width: 16 },
      {
        key: "paid",
        header: "Fecha de entero",
        kind: "date",
        width: 12,
        note: `Solo para retenciones ${MADE.toLowerCase()}s: fecha en que pagaste lo retenido al SAR.`,
      },
      {
        key: "due",
        header: "Vence el entero",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("date")}="",${r.c("type")}<>"${MADE}"),"",WORKDAY(DATE(YEAR(${r.c("date")}),MONTH(${r.c("date")})+1,${dueDay})-1,1))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 16,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("type")}="",${r.c("amount")}=""),"",IF(${r.c("type")}="${MADE}",IF(${r.c("paid")}<>"","Enterada",IF(TODAY()>${r.c("due")},"Vencida","Por enterar")),IF(${r.c("cert")}="","Pedir constancia","Con constancia")))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 32,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 15),
            type: MADE,
            party: "Consultores Asociados S. de R.L.",
            partyId: "0801-2015-001234",
            doc: "000-001-01-00000452",
            concept: conceptOf("isr-honorarios"),
            base: 20_000,
            cert: "CR-0001",
            paid: exampleDate(y, 2, 9),
          },
          {
            date: exampleDate(y, 2, 10),
            type: MADE,
            party: "Ing. Carlos Mejía",
            partyId: "0801-1985-004567",
            doc: "000-001-01-00000087",
            concept: conceptOf("isr-honorarios"),
            base: 8_000,
            cert: "CR-0002",
          },
          {
            date: exampleDate(y, 2, 20),
            type: RECEIVED,
            party: "Distribuidora Nacional S.A.",
            partyId: "0801-2001-009876",
            doc: "000-001-01-00001290",
            concept: conceptOf("isr-pago-a-cuenta"),
            base: 150_000,
            cert: "R-7781",
          },
          {
            date: exampleDate(y, 2, 25),
            type: RECEIVED,
            party: "Hospital Central S.A.",
            partyId: "0801-1999-000321",
            doc: "000-001-01-00001302",
            concept: conceptOf("isv-agente"),
            base: 10_000,
          },
        ]
      : undefined,
  });

  const T = table.range("type");
  const A = table.range("amount");
  const S = table.range("status");
  const X = table.range("tax");
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 4,
    labelSpan: 3,
    fields: [
      {
        key: "pending",
        label: "Retenido pendiente de enterar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `SUMIFS(${A},${T},"${MADE}")-SUMIFS(${A},${T},"${MADE}",${S},"Enterada")`,
      },
      {
        key: "late",
        label: "Retenciones vencidas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${S},"Vencida")`,
      },
      {
        key: "isrReceived",
        label: `${isr} que te retuvieron`,
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${A},${T},"${RECEIVED}",${X},"${isr}")`,
      },
      {
        key: "isvReceived",
        label: `${isv} que te retuvieron`,
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${A},${T},"${RECEIVED}",${X},"${isv}")`,
      },
      {
        key: "certs",
        label: "Constancias por pedir",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${S},"Pedir constancia")`,
      },
    ],
    theme,
    ctx,
  });

  const s = table.letter("status");
  const rowRange = `A${table.firstRow}:${s}${table.lastRow}`;
  highlightWhen(
    ws,
    rowRange,
    `$${s}${table.firstRow}="Vencida"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(
    ws,
    rowRange,
    `$${s}${table.firstRow}="Pedir constancia"`,
    { fill: theme.warningSoft },
    2,
  );
  highlightWhen(ws, rowRange, `$${s}${table.firstRow}="Enterada"`, { color: theme.muted }, 3);
  await protectSheet(ws);

  // Resumen mensual y por concepto
  addSheetHeader(summary, {
    title: `Resumen de retenciones ${config.year}`,
    subtitle: "Se llena solo con la hoja Retenciones. El año se cambia en Parámetros.",
    theme,
    width: 7,
  });
  const R = (key: string) => table.sheetRange(key);
  const inMonth = (start?: string, end?: string) =>
    `${R("date")},">="&${start},${R("date")},"<="&${end}`;
  const monthly = addMonthlySummary(summary, {
    startRow: 4,
    startCol: 1,
    yearCell: params.ref("year"),
    values: [
      {
        header: `${isr} retenido`,
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${MADE}",${R("tax")},"${isr}",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: `${isv} retenido`,
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${MADE}",${R("tax")},"${isv}",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Total retenido",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${MADE}",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Enterado",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${MADE}",${R("status")},"Enterada",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Pendiente",
        kind: "currency",
        formula: (k) => `D${k.row}-E${k.row}`,
      },
      {
        header: `${isr} que te retuvieron`,
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${RECEIVED}",${R("tax")},"${isr}",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: `${isv} que te retuvieron`,
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"${RECEIVED}",${R("tax")},"${isv}",${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
    theme,
    ctx,
  });
  addCategorySummary(summary, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Concepto",
    labelWidth: 34,
    sourceCells: cellsOfRange(params.tableColumn("rules", 0)),
    values: [
      {
        header: "Retenciones efectuadas",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIFS(${R("amount")},${R("concept")},${k.labelCell},${R("type")},"${MADE}")`,
          ),
      },
      {
        header: "Retenciones recibidas",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIFS(${R("amount")},${R("concept")},${k.labelCell},${R("type")},"${RECEIVED}")`,
          ),
      },
      {
        header: "Registros",
        kind: "integer",
        formula: (k) => ifLabel(k, `COUNTIF(${R("concept")},${k.labelCell})`),
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(summary);

  addInstructionsSheet(wb, {
    title: "Control de retenciones",
    description: `Lleva en un solo lugar las retenciones de ${isr} y ${isv} que efectúas a tus proveedores y las que te efectúan tus clientes.`,
    steps: [
      `Registra cada retención con su fecha, el tipo (${MADE} o ${RECEIVED}), el proveedor o cliente, la factura y el concepto.`,
      "Escribe la base (monto sin impuesto): la tasa y la retención se calculan con los valores de Parámetros.",
      `En las retenciones ${MADE.toLowerCase()}s anota el número de constancia que entregaste y, cuando pagues al SAR, la fecha de entero.`,
      `En las ${RECEIVED.toLowerCase()}s anota el número de la constancia que te dieron: la necesitas para acreditar el impuesto en tu declaración.`,
      "Revisa arriba lo pendiente de enterar y las retenciones vencidas; la hoja Resumen muestra los totales por mes y por concepto.",
    ],
    sheets: [
      { name: "Retenciones", description: "Registro de cada retención con su estado." },
      { name: "Resumen", description: "Totales por mes, por impuesto y por concepto." },
      { name: "Parámetros", description: "Conceptos, tasas y día de vencimiento del entero." },
    ],
    tips: [
      `Las retenciones de ${isv} que te hicieron se restan en tu declaración mensual del ${isv}.`,
      `Las retenciones de ${isr} que te hicieron son pagos a cuenta de tu ${isr} anual: guarda las constancias.`,
      "La fecha de vencimiento se corre al siguiente día hábil si cae en fin de semana (no considera feriados).",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
