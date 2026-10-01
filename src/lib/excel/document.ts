import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { amountInWordsRef } from "./amount-in-words";
import { highlightWhen } from "./conditional";
import { FMT, currencyFormat } from "./formats";
import { fitWithin, parseImageDataUrl } from "./image";
import { addListsSheet } from "./lists";
import { addParametersSheet, salesTaxTable, type ParamRow, type ParamsRef } from "./params";
import { absAddr, addr, colLetter, formulaString, rangeAddr } from "./refs";
import { addSheet } from "./sheet";
import {
  font,
  solidFill,
  styleCalc,
  styleInput,
  styleLabel,
  styleNote,
  styleTitle,
  styleTotal,
  thinBorder,
  toArgb,
  type SheetTheme,
} from "./styles";
import { addTable, blankUnlessAll, type ColumnDef, type TableRef } from "./table";
import { dateValidation, decimalMin, listFromRange, listInline, wholeMin } from "./validation";

export interface DocumentBusiness {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  logo?: string | null;
}

export interface DocumentExtraField {
  key: string;
  label: string;
  kind: "text" | "date" | "currency" | "integer";
  /** Fórmula opcional (p. ej. "Válida hasta" = fecha + días) */
  formula?: (refs: { date: string }) => string;
  value?: string | number | null;
}

export interface CommercialDocumentOptions {
  /** Nombre de la hoja y título visible: "FACTURA", "COTIZACIÓN"… */
  sheetName: string;
  title: string;
  business: DocumentBusiness;
  theme: SheetTheme;
  ctx: CountryContext;
  numbering: { prefix: string; start: number; digits: number };
  /** Datos fiscales (CAI, rango autorizado, fecha límite) */
  fiscal?: {
    cai: string;
    rangeFrom: number | null;
    rangeTo: number | null;
    deadline: string | null;
    legends: string[];
  };
  counterpartyLabel: "Cliente" | "Proveedor";
  extraFields?: DocumentExtraField[];
  lines: number;
  columns: { code: boolean; discount: boolean; unit: boolean };
  tax: { enabled: boolean; defaultRateId: string };
  paymentMethods: string[];
  showPaymentTerms: boolean;
  amountInWords: boolean;
  exemptionFields?: string[];
  notes?: string;
  terms?: string[];
  signatures?: string[];
  paper: "letter" | "a4";
  example?: Array<Record<string, string | number>>;
  /** Parámetros adicionales del documento */
  extraParams?: ParamRow[];
}

export interface CommercialDocumentRefs {
  ws: ExcelJS.Worksheet;
  params: ParamsRef;
  table: TableRef;
  numberCell: string;
  correlativeCell: string;
  dateCell: string;
  totalCell: string;
  discountTotalCell: string | null;
  subtotalCell: string | null;
  baseByRate: Record<string, string>;
  taxByRate: Record<string, string>;
  wordsCell: string | null;
}

const ROW_HEIGHT = 18;

/**
 * Construye una hoja de documento comercial (factura, cotización, orden de
 * compra, nota de crédito) con encabezado del negocio, tabla de líneas con
 * fórmulas, totales desglosados por tasa de impuesto y monto en letras.
 */
export function addCommercialDocument(
  wb: ExcelJS.Workbook,
  opts: CommercialDocumentOptions,
): CommercialDocumentRefs {
  const { ctx, theme } = opts;
  const salesTax = ctx.taxes.salesTax;
  const ws = addSheet(wb, opts.sheetName, {
    paper: opts.paper,
    showGridLines: false,
    tabColor: theme.primary,
  });

  // --- Hoja de parámetros (se crea antes de escribir fórmulas) -------------
  const paramRows: ParamRow[] = [
    { key: "prefix", label: "Prefijo de numeración", value: opts.numbering.prefix, kind: "text" },
  ];
  if (opts.fiscal) {
    paramRows.push(
      {
        key: "cai",
        label: `${ctx.invoicing.authorizationCodeName} — ${ctx.invoicing.authorizationCodeDescription}`,
        value: opts.fiscal.cai || null,
        kind: "text",
      },
      {
        key: "rangeFrom",
        label: "Rango autorizado: desde (correlativo)",
        value: opts.fiscal.rangeFrom,
        kind: "integer",
      },
      {
        key: "rangeTo",
        label: "Rango autorizado: hasta (correlativo)",
        value: opts.fiscal.rangeTo,
        kind: "integer",
      },
      {
        key: "deadline",
        label: "Fecha límite de emisión",
        value: opts.fiscal.deadline ? isoToDate(opts.fiscal.deadline) : null,
        kind: "date",
      },
    );
  }
  paramRows.push(...(opts.extraParams ?? []));

  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      { title: opts.fiscal ? "Datos de facturación" : "Datos del documento", rows: paramRows },
    ],
    tables: opts.tax.enabled ? [salesTaxTable(ctx)] : [],
  });

  const lists = addListsSheet(wb, theme, [
    { key: "payment", title: "Formas de pago", values: opts.paymentMethods },
    { key: "terms", title: "Condición", values: ["Contado", "Crédito"], spare: 3 },
  ]);

  // --- Columnas de la tabla de líneas ---------------------------------------
  const rateLabels = salesTax.rates.map((r) => r.label);
  const defaultRate =
    salesTax.rates.find((r) => r.id === opts.tax.defaultRateId)?.label ?? rateLabels[0] ?? "";
  const taxTable = opts.tax.enabled ? params.table("salesTax") : "";
  const rateLabelsRange = opts.tax.enabled ? params.tableColumn("salesTax", 0) : "";

  const columns: ColumnDef[] = [
    {
      key: "n",
      header: "#",
      kind: "formula",
      width: 5,
      align: "center",
      formula: (r) => `IF(${r.c("desc")}="","",${r.index + 1})`,
      resultKind: "integer",
    },
  ];
  if (opts.columns.code) columns.push({ key: "code", header: "Código", kind: "text", width: 12 });
  columns.push({
    key: "desc",
    header: "Descripción",
    kind: "text",
    width: opts.columns.code ? 34 : 42,
    wrap: true,
  });
  if (opts.columns.unit) columns.push({ key: "unit", header: "Unidad", kind: "text", width: 9 });
  columns.push(
    { key: "qty", header: "Cantidad", kind: "number", width: 10, align: "center" },
    { key: "price", header: "Precio unitario", kind: "currency", width: 15 },
  );
  if (opts.columns.discount) {
    columns.push({
      key: "disc",
      header: "Descuento",
      kind: "currency",
      width: 13,
      total: "sum",
      note: "Monto del descuento de la línea (no porcentaje).",
    });
  }
  const discountExpr = opts.columns.discount
    ? (r: { c: (k: string) => string }) => `-${r.c("disc")}`
    : () => "";
  columns.push({
    key: "sub",
    header: opts.tax.enabled ? "Subtotal" : "Total",
    kind: "formula",
    width: 15,
    resultKind: "currency",
    total: "sum",
    formula: (r) =>
      blankUnlessAll(
        [r.c("qty"), r.c("price")],
        `ROUND(${r.c("qty")}*${r.c("price")}${discountExpr(r)},2)`,
      ),
  });
  if (opts.tax.enabled) {
    columns.push(
      {
        key: "rate",
        header: `Tipo ${salesTax.name}`,
        kind: "list",
        width: 12,
        align: "center",
        list: { source: rateLabelsRange },
        fill: defaultRate,
      },
      {
        key: "tax",
        header: salesTax.name,
        kind: "formula",
        width: 13,
        resultKind: "currency",
        total: "sum",
        formula: (r) =>
          `IF(${r.c("sub")}="","",ROUND(${r.c("sub")}*IFERROR(VLOOKUP(${r.c("rate")},${taxTable},2,0),0),2))`,
      },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        width: 15,
        resultKind: "currency",
        total: "sum",
        formula: (r) => `IF(${r.c("sub")}="","",${r.c("sub")}+${r.c("tax")})`,
      },
    );
  }

  const lastCol = columns.length;
  const docLabelCol = lastCol - 2;
  const docValueCol = lastCol - 1;
  const leftEnd = lastCol - 3;
  columns.forEach((c, i) => {
    if (c.width) ws.getColumn(i + 1).width = c.width;
  });

  // --- Encabezado: negocio --------------------------------------------------
  for (let r = 1; r <= 5; r++) ws.getRow(r).height = r === 1 ? 26 : ROW_HEIGHT;
  const logo = parseImageDataUrl(opts.business.logo);
  let textStartCol = 1;
  if (logo) {
    const colPx = (n: number) => (ws.getColumn(n).width ?? 10) * 7 + 5;
    const available = colPx(1) + colPx(2) - 8;
    const size = fitWithin(logo.width, logo.height, Math.min(available, 170), 92);
    const imageId = wb.addImage({ base64: logo.base64, extension: logo.extension });
    ws.addImage(imageId, { tl: { col: 0.1, row: 0.15 }, ext: size, editAs: "oneCell" });
    textStartCol = 3;
  }
  const textEndCol = Math.max(textStartCol, leftEnd);
  const businessLines: [string, boolean][] = [
    [opts.business.name || "Nombre de tu negocio", true],
    [opts.business.taxId ? `${ctx.taxId.name}: ${opts.business.taxId}` : "", false],
    [opts.business.address, false],
    [opts.business.phone ? `Tel.: ${opts.business.phone}` : "", false],
    [opts.business.email, false],
  ];
  businessLines.forEach(([text, isName], i) => {
    const r = i + 1;
    if (textEndCol > textStartCol) ws.mergeCells(r, textStartCol, r, textEndCol);
    const cell = ws.getCell(r, textStartCol);
    cell.value = text || null;
    if (isName) styleTitle(cell, theme, 16);
    else cell.font = font(theme, { size: 10, color: theme.muted });
    cell.alignment = { vertical: "middle", wrapText: false };
  });

  // --- Encabezado: documento ------------------------------------------------
  ws.mergeCells(1, docLabelCol, 1, lastCol);
  const titleCell = ws.getCell(1, docLabelCol);
  titleCell.value = opts.title;
  titleCell.font = font(theme, { bold: true, size: 18, color: theme.onPrimary });
  titleCell.fill = solidFill(theme.primary);
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  const docRow = (r: number, label: string) => {
    const l = ws.getCell(r, docLabelCol);
    l.value = label;
    styleLabel(l, theme);
    l.alignment = { horizontal: "right", vertical: "middle" };
    ws.mergeCells(r, docValueCol, r, lastCol);
    return ws.getCell(r, docValueCol);
  };

  const correlativeCell = docRow(4, "Correlativo");
  const correlativeAddr = absAddr(docValueCol, 4);
  correlativeCell.value = opts.numbering.start;
  styleInput(correlativeCell, theme);
  correlativeCell.numFmt = FMT.integer;
  correlativeCell.alignment = { horizontal: "center" };
  correlativeCell.note = "Aumenta este número en cada documento nuevo.";
  wholeMin(ws, addr(docValueCol, 4), 1);

  const numberCell = docRow(2, "N.º");
  const numberAddr = absAddr(docValueCol, 2);
  const pad = "0".repeat(Math.max(1, opts.numbering.digits));
  numberCell.value = {
    formula: `${params.ref("prefix")}&TEXT(${correlativeAddr},${formulaString(pad)})`,
  };
  styleCalc(numberCell, theme);
  numberCell.font = font(theme, { bold: true });
  numberCell.alignment = { horizontal: "center" };

  const dateCell = docRow(3, "Fecha");
  const dateAddr = absAddr(docValueCol, 3);
  dateCell.value = null;
  styleInput(dateCell, theme);
  dateCell.numFmt = FMT.date;
  dateCell.alignment = { horizontal: "center" };
  dateValidation(ws, addr(docValueCol, 3));

  let row = 7;

  // --- Bloque fiscal --------------------------------------------------------
  if (opts.fiscal) {
    const fiscalRows: [string, string][] = [
      [ctx.invoicing.authorizationCodeName, `IF(${params.ref("cai")}="","",${params.ref("cai")})`],
      [
        "Rango autorizado",
        `IF(OR(${params.ref("rangeFrom")}="",${params.ref("rangeTo")}=""),"",` +
          `${params.ref("prefix")}&TEXT(${params.ref("rangeFrom")},${formulaString(pad)})&" al "&` +
          `${params.ref("prefix")}&TEXT(${params.ref("rangeTo")},${formulaString(pad)}))`,
      ],
      ["Fecha límite de emisión", `IF(${params.ref("deadline")}="","",${params.ref("deadline")})`],
    ];
    for (const [label, formula] of fiscalRows) {
      const l = ws.getCell(row, 1);
      l.value = label;
      styleLabel(l, theme);
      ws.mergeCells(row, 1, row, Math.min(2, lastCol));
      ws.mergeCells(row, 3, row, leftEnd);
      const v = ws.getCell(row, 3);
      v.value = { formula };
      v.font = font(theme);
      if (label.startsWith("Fecha")) {
        v.numFmt = FMT.date;
        v.alignment = { horizontal: "left" };
      }
      row++;
    }
    // Avisos en rojo cuando el correlativo sale del rango o la fecha vence
    highlightWhen(
      ws,
      numberAddr.replace(/\$/g, ""),
      `AND(${params.ref("rangeFrom")}<>"",${params.ref("rangeTo")}<>"",OR(${correlativeAddr}<${params.ref("rangeFrom")},${correlativeAddr}>${params.ref("rangeTo")}))`,
      { fill: theme.dangerSoft, color: theme.danger, bold: true },
    );
    highlightWhen(
      ws,
      dateAddr.replace(/\$/g, ""),
      `AND(${dateAddr}<>"",${params.ref("deadline")}<>"",${dateAddr}>${params.ref("deadline")})`,
      { fill: theme.dangerSoft, color: theme.danger, bold: true },
    );
    row++;
  }

  // --- Cliente / proveedor --------------------------------------------------
  const sectionTitle = ws.getCell(row, 1);
  sectionTitle.value = `Datos del ${opts.counterpartyLabel.toLowerCase()}`;
  sectionTitle.font = font(theme, { bold: true, color: theme.primaryDark });
  ws.mergeCells(row, 1, row, lastCol);
  sectionTitle.border = { bottom: { style: "thin", color: { argb: toArgb(theme.primary) } } };
  row++;

  const leftFields: string[] = [opts.counterpartyLabel, ctx.taxId.name, "Dirección"];
  if (opts.exemptionFields?.length) leftFields.push(...opts.exemptionFields);
  const rightFields: {
    label: string;
    kind: DocumentExtraField["kind"] | "payment" | "terms";
    formula?: (r: { date: string }) => string;
    value?: string | number | null;
  }[] = [];
  if (opts.showPaymentTerms) {
    rightFields.push({ label: "Condición", kind: "terms" });
    rightFields.push({ label: "Forma de pago", kind: "payment" });
  }
  for (const f of opts.extraFields ?? []) rightFields.push(f);

  const blockRows = Math.max(leftFields.length, rightFields.length);
  for (let i = 0; i < blockRows; i++) {
    const r = row + i;
    ws.getRow(r).height = ROW_HEIGHT;
    const leftLabel = leftFields[i];
    if (leftLabel) {
      const l = ws.getCell(r, 1);
      l.value = leftLabel;
      styleLabel(l, theme);
      l.font = font(theme, { bold: true, size: leftLabel.length > 30 ? 9 : 11 });
      ws.mergeCells(r, 1, r, Math.min(2, lastCol));
      ws.mergeCells(r, 3, r, leftEnd);
      styleInput(ws.getCell(r, 3), theme);
    }
    const right = rightFields[i];
    if (right) {
      const l = ws.getCell(r, docLabelCol);
      l.value = right.label;
      styleLabel(l, theme);
      l.alignment = { horizontal: "right", vertical: "middle" };
      ws.mergeCells(r, docValueCol, r, lastCol);
      const v = ws.getCell(r, docValueCol);
      const target = addr(docValueCol, r);
      if (right.formula) {
        v.value = { formula: right.formula({ date: dateAddr }) };
        styleCalc(v, theme);
      } else {
        v.value = right.value ?? null;
        styleInput(v, theme);
      }
      if (right.kind === "date") {
        v.numFmt = FMT.date;
        if (!right.formula) dateValidation(ws, target);
      } else if (right.kind === "currency") {
        v.numFmt = currencyFormat(ctx);
        if (!right.formula) decimalMin(ws, target, 0);
      } else if (right.kind === "integer") {
        v.numFmt = FMT.integer;
      } else if (right.kind === "payment") {
        listFromRange(ws, target, lists.source("payment"));
      } else if (right.kind === "terms") {
        v.value = "Contado";
        listInline(ws, target, ["Contado", "Crédito"]);
      }
      v.alignment = { horizontal: "center", vertical: "middle" };
    }
  }
  row += blockRows + 1;

  // --- Tabla de líneas ------------------------------------------------------
  const table = addTable(ws, {
    startRow: row,
    columns,
    rows: opts.lines,
    theme,
    ctx,
    zebra: true,
    totals: false,
    example: opts.example,
  });
  highlightWhen(
    ws,
    rangeAddr(1, table.firstRow, lastCol, table.lastRow),
    `AND($${table.letter("qty")}${table.firstRow}<>"",$${table.letter("desc")}${table.firstRow}="")`,
    { fill: theme.warningSoft },
  );
  row = table.lastRow + 1;

  // --- Totales --------------------------------------------------------------
  const totalsStart = row;
  const totalLabelCol = docLabelCol;
  const totalRow = (label: string | { formula: string }, formula: string, emphasis = false) => {
    ws.mergeCells(row, totalLabelCol, row, docValueCol);
    const l = ws.getCell(row, totalLabelCol);
    l.value = typeof label === "string" ? label : { formula: label.formula };
    l.font = font(theme, { bold: emphasis });
    l.alignment = { horizontal: "right", vertical: "middle" };
    const v = ws.getCell(row, lastCol);
    v.value = { formula };
    v.numFmt = currencyFormat(ctx);
    if (emphasis) {
      styleTotal(v, theme);
      v.font = font(theme, { bold: true, size: 12 });
      l.fill = solidFill(theme.total);
    } else styleCalc(v, theme);
    const ref = absAddr(lastCol, row);
    row++;
    return ref;
  };

  let discountTotalCell: string | null = null;
  let subtotalCell: string | null = null;
  const baseByRate: Record<string, string> = {};
  const taxByRate: Record<string, string> = {};
  let totalCell: string;

  if (opts.columns.discount) {
    discountTotalCell = totalRow(
      "Descuentos y rebajas otorgados",
      `SUM(${table.range("disc", false)})`,
    );
  }
  if (opts.tax.enabled) {
    subtotalCell = totalRow("Subtotal", `SUM(${table.range("sub", false)})`);
    salesTax.rates.forEach((rate, i) => {
      const labelRef = `INDEX(${rateLabelsRange},${i + 1})`;
      const prefix = rate.rate === 0 ? "Importe " : "Importe gravado ";
      baseByRate[rate.id] = totalRow(
        { formula: `${formulaString(prefix)}&${labelRef}` },
        `SUMIF(${table.range("rate")},${labelRef},${table.range("sub")})`,
      );
    });
    salesTax.rates.forEach((rate, i) => {
      if (rate.rate === 0) return;
      const labelRef = `INDEX(${rateLabelsRange},${i + 1})`;
      taxByRate[rate.id] = totalRow(
        { formula: labelRef },
        `SUMIF(${table.range("rate")},${labelRef},${table.range("tax")})`,
      );
    });
    totalCell = totalRow("TOTAL A PAGAR", `SUM(${table.range("total", false)})`, true);
  } else {
    totalCell = totalRow("TOTAL", `SUM(${table.range("sub", false)})`, true);
  }
  const totalsEnd = row - 1;

  // --- Bloque izquierdo bajo la tabla: letras, notas, condiciones -----------
  let leftRow = totalsStart;
  let wordsCell: string | null = null;
  if (opts.amountInWords) {
    const wordsRef = amountInWordsRef(wb, `${quoteSelf(ws)}!${totalCell}`, ctx);
    const l = ws.getCell(leftRow, 1);
    l.value = "Son:";
    styleLabel(l, theme);
    ws.mergeCells(leftRow, 2, leftRow + 1, leftEnd);
    const w = ws.getCell(leftRow, 2);
    w.value = { formula: wordsRef };
    w.font = font(theme, { size: 10, bold: true });
    w.alignment = { wrapText: true, vertical: "top" };
    w.border = thinBorder(theme.border);
    wordsCell = absAddr(2, leftRow);
    leftRow += 3;
  }
  const notes = [opts.notes ?? "", ...(opts.terms ?? [])].filter(Boolean);
  if (notes.length) {
    const l = ws.getCell(leftRow, 1);
    l.value = opts.terms?.length ? "Condiciones y notas" : "Notas";
    l.font = font(theme, { bold: true, color: theme.primaryDark });
    ws.mergeCells(leftRow, 1, leftRow, leftEnd);
    leftRow++;
    for (const n of notes) {
      ws.mergeCells(leftRow, 1, leftRow, leftEnd);
      const c = ws.getCell(leftRow, 1);
      c.value = `• ${n}`;
      c.font = font(theme, { size: 10 });
      c.alignment = { wrapText: true, vertical: "top" };
      ws.getRow(leftRow).height = n.length > 70 ? 28 : ROW_HEIGHT;
      leftRow++;
    }
  }

  row = Math.max(totalsEnd, leftRow) + 2;

  // --- Firmas ---------------------------------------------------------------
  if (opts.signatures?.length) {
    const span = Math.max(1, Math.floor(lastCol / opts.signatures.length));
    opts.signatures.forEach((label, i) => {
      const c1 = 1 + i * span;
      const c2 = Math.min(lastCol, c1 + span - 2);
      if (c2 > c1) ws.mergeCells(row, c1, row, c2);
      const line = ws.getCell(row, c1);
      line.border = { top: { style: "thin", color: { argb: "FF5B6762" } } };
      line.value = label;
      line.font = font(theme, { size: 9, color: theme.muted });
      line.alignment = { horizontal: "center", vertical: "top" };
    });
    row += 2;
  }

  // --- Leyendas fiscales ----------------------------------------------------
  for (const legend of opts.fiscal?.legends ?? []) {
    ws.mergeCells(row, 1, row, lastCol);
    const c = ws.getCell(row, 1);
    c.value = legend;
    styleNote(c, theme);
    c.alignment = { horizontal: "center" };
    row++;
  }

  ws.pageSetup.printArea = `A1:${colLetter(lastCol)}${row}`;

  return {
    ws,
    params,
    table,
    numberCell: numberAddr,
    correlativeCell: correlativeAddr,
    dateCell: dateAddr,
    totalCell,
    discountTotalCell,
    subtotalCell,
    baseByRate,
    taxByRate,
    wordsCell,
  };
}

function quoteSelf(ws: ExcelJS.Worksheet): string {
  return `'${ws.name.replace(/'/g, "''")}'`;
}

function isoToDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}
