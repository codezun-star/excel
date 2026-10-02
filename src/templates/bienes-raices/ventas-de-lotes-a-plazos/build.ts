import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme } from "@/lib/excel/styles";
import { addMonthlySummary } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { LotesConfig } from "./form";

/** Cuota mensual (misma regla que la fórmula de la hoja) para que los pagos de ejemplo cuadren. */
function payment(financed: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  const p = r === 0 ? financed / months : (financed * r) / (1 - (1 + r) ** -months);
  return Math.round(p * 100) / 100;
}

export const build: TemplateBuild<LotesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const unit = config.unit === "varas" ? "v²" : "m²";
  const title = titleWith("Venta de lotes a plazos", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const lots = addSheet(wb, "Lotes", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const sales = addSheet(wb, "Contratos", {
    freezeRows: 4,
    freezeCols: 3,
    tabColor: theme.primary,
    landscape: true,
  });
  const pays = addSheet(wb, "Pagos", { freezeRows: 4, tabColor: theme.primary });
  const st = addSheet(wb, "Estado de cuenta", { freezeRows: 17, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;
  const ppu = config.pricePerUnit;
  const rate = config.rate / 100;
  const term = config.term;

  // Los rangos de Contratos y Pagos se conocen por su posición fija (encabezado en la fila 4)
  const salesLast = 4 + config.sales;
  const salesRange = (col: string) => `'Contratos'!$${col}$5:$${col}$${salesLast}`;

  // Lotes
  addSheetHeader(lots, {
    title: titleWith("Inventario de lotes", config.businessName),
    subtitle: `Área en ${config.unit} cuadradas; el estado y el cliente se llenan con los contratos.`,
    theme,
    width: 8,
  });
  const lt = addTable(lots, {
    startRow: 4,
    columns: [
      { key: "lot", header: "Lote", kind: "text", width: 10, align: "center" },
      { key: "block", header: "Bloque o etapa", kind: "text", width: 12 },
      { key: "area", header: `Área (${unit})`, kind: "number", width: 11, total: "sum" },
      { key: "ppu", header: `Precio por ${unit}`, kind: "currency", width: 13, fill: ppu },
      {
        key: "price",
        header: "Precio del lote",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) => `IF(${r.c("lot")}="","",${r.c("area")}*${r.c("ppu")})`,
      },
      {
        key: "reserved",
        header: "Reservado",
        kind: "list",
        width: 10,
        list: ["Sí", "No"],
        align: "center",
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("lot")}="","",IF(COUNTIF(${salesRange("F")},${r.c("lot")})>0,"Vendido",IF(${r.c("reserved")}="Sí","Reservado","Disponible")))`,
      },
      {
        key: "client",
        header: "Cliente",
        kind: "formula",
        width: 26,
        formula: (r) =>
          `IF(${r.c("lot")}="","",IFERROR(INDEX(${salesRange("C")},MATCH(${r.c("lot")},${salesRange("F")},0)),""))`,
      },
    ],
    rows: config.lots,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: ex
      ? [
          { lot: "A-01", block: "Etapa 1", area: 200 },
          { lot: "A-02", block: "Etapa 1", area: 200 },
          { lot: "A-03", block: "Etapa 1", area: 250, reserved: "Sí" },
          { lot: "B-01", block: "Etapa 2", area: 300 },
          { lot: "B-02", block: "Etapa 2", area: 300 },
        ]
      : undefined,
  });
  const L = (k: string) => lt.sheetRange(k);
  const stCol = lt.letter("status");
  highlightWhen(
    lots,
    `${stCol}${lt.firstRow}:${stCol}${lt.lastRow}`,
    `${stCol}${lt.firstRow}="Disponible"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    lots,
    `${stCol}${lt.firstRow}:${stCol}${lt.lastRow}`,
    `${stCol}${lt.firstRow}="Reservado"`,
    { fill: lighten(theme.highlight, 0.7) },
    2,
  );

  // Contratos
  const exPay = (area: number, down: number) => payment(area * ppu - down, rate, term);
  addSheetHeader(sales, {
    title: "Contratos de venta",
    subtitle: "Un contrato por lote vendido; los pagos se suman desde la hoja Pagos.",
    theme,
    width: 20,
  });
  const payRange = (col: string) => `'Pagos'!$${col}$5:$${col}$${4 + config.payments}`;
  const today = "TODAY()";
  const vt = addTable(sales, {
    startRow: 4,
    columns: [
      {
        key: "id",
        header: "Contrato",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) => correlativeId("V-", r.c("client"), r.index),
      },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "text", width: 26 },
      { key: "dni", header: "Identidad", kind: "text", width: 16 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      {
        key: "lot",
        header: "Lote",
        kind: "list",
        width: 9,
        list: { source: L("lot") },
        align: "center",
      },
      {
        key: "price",
        header: "Precio",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("lot")}="","",IFERROR(INDEX(${L("price")},MATCH(${r.c("lot")},${L("lot")},0)),""))`,
      },
      { key: "down", header: "Prima", kind: "currency", width: 12, total: "sum" },
      {
        key: "financed",
        header: "Financiado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("price")}="","",MAX(0,${r.c("price")}-${r.c("down")}))`,
      },
      { key: "rate", header: "Tasa anual", kind: "percent", width: 9, fill: rate },
      { key: "term", header: "Plazo (meses)", kind: "integer", width: 9, fill: term },
      { key: "first", header: "Primera cuota", kind: "date", width: 12 },
      {
        key: "payment",
        header: "Cuota mensual",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("client")}="",${r.c("financed")}=""),"",IF(N(${r.c("term")})=0,${r.c("financed")},IF(N(${r.c("rate")})=0,ROUND(${r.c("financed")}/${r.c("term")},2),ROUND(PMT(${r.c("rate")}/12,${r.c("term")},-${r.c("financed")}),2))))`,
      },
      {
        key: "paid",
        header: "Pagado en cuotas",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("payment")}="","",SUMIFS(${payRange("E")},${payRange("B")},${r.c("id")}))`,
      },
      {
        key: "due",
        header: "Cuotas vencidas",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("payment")}="",${r.c("first")}=""),"",MAX(0,MIN(${r.c("term")},(YEAR(${today})-YEAR(${r.c("first")}))*12+MONTH(${today})-MONTH(${r.c("first")})+IF(DAY(${today})>=DAY(${r.c("first")}),1,0))))`,
      },
      {
        key: "paidCount",
        header: "Cuotas pagadas",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("payment")}="",N(${r.c("payment")})=0),"",INT(ROUND(${r.c("paid")}/${r.c("payment")},4)))`,
      },
      {
        key: "late",
        header: "Atraso",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("payment")}="",${r.c("due")}=""),"",MAX(0,ROUND(${r.c("due")}*${r.c("payment")}-${r.c("paid")},2)))`,
      },
      {
        key: "balance",
        header: "Saldo por pagar",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("payment")}="","",MAX(0,ROUND(${r.c("payment")}*${r.c("term")}-${r.c("paid")},2)))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(${r.c("payment")}="","",IF(${r.c("balance")}<=0,"Cancelado",IF(N(${r.c("late")})>0,"Atrasado","Al día")))`,
      },
    ],
    rows: config.sales,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? [
          {
            date: fromToday(-88),
            client: "Wilmer Antonio Cruz",
            dni: "0801-1985-11111",
            phone: "9911-2233",
            lot: "A-01",
            down: 24000,
            first: fromToday(-80),
          },
          {
            date: fromToday(-118),
            client: "Sandra Elizabeth Paz",
            dni: "1804-1990-22222",
            phone: "3345-6789",
            lot: "B-01",
            down: 36000,
            first: fromToday(-110),
          },
          {
            date: fromToday(-10),
            client: "Héctor Banegas",
            lot: "A-02",
            down: 40000,
            first: fromToday(20),
          },
        ]
      : undefined,
  });
  if (vt.lastRow !== salesLast) throw new Error("Rango de contratos inesperado");
  const V = (k: string) => vt.sheetRange(k);
  const sCol = vt.letter("status");
  highlightWhen(
    sales,
    `A${vt.firstRow}:${sCol}${vt.lastRow}`,
    `$${sCol}${vt.firstRow}="Atrasado"`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    sales,
    `${sCol}${vt.firstRow}:${sCol}${vt.lastRow}`,
    `${sCol}${vt.firstRow}="Cancelado"`,
    { fill: theme.okSoft, bold: true },
    2,
  );

  // Pagos
  addSheetHeader(pays, {
    title: "Pagos recibidos",
    subtitle: "Cada cuota o abono con su contrato y recibo.",
    theme,
    width: 7,
  });
  const p1 = exPay(200, 24000);
  const p2 = exPay(300, 36000);
  const pt = addTable(pays, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "sale",
        header: "Contrato",
        kind: "list",
        width: 10,
        list: { source: V("id") },
        align: "center",
      },
      {
        key: "client",
        header: "Cliente",
        kind: "formula",
        width: 26,
        formula: (r) =>
          `IF(${r.c("sale")}="","",IFERROR(INDEX(${V("client")},MATCH(${r.c("sale")},${V("id")},0)),""))`,
      },
      { key: "receipt", header: "Recibo", kind: "text", width: 12 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 15,
        list: ["Efectivo", "Depósito", "Transferencia", "Tarjeta"],
      },
      { key: "note", header: "Nota", kind: "text", width: 24 },
    ],
    rows: config.payments,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-80),
            sale: "V-001",
            receipt: "R-0101",
            amount: p1,
            method: "Depósito",
          },
          {
            date: fromToday(-50),
            sale: "V-001",
            receipt: "R-0115",
            amount: p1,
            method: "Depósito",
          },
          {
            date: fromToday(-20),
            sale: "V-001",
            receipt: "R-0130",
            amount: p1,
            method: "Transferencia",
          },
          {
            date: fromToday(-110),
            sale: "V-002",
            receipt: "R-0090",
            amount: p2,
            method: "Efectivo",
          },
        ]
      : undefined,
  });
  const P = (k: string) => pt.sheetRange(k);

  // Estado de cuenta con amortización
  addSheetHeader(st, {
    title: "Estado de cuenta",
    subtitle: "Elige el contrato para ver su tabla de pagos.",
    theme,
    width: 8,
  });
  const lookup = (key: string, idx: string) => `IF(${idx}="","",INDEX(${V(key)},${idx}))`;
  const sf = addFields(st, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    valueSpan: 2,
    fields: [
      {
        key: "sale",
        label: "Contrato",
        kind: "list",
        list: { source: V("id") },
        value: ex ? "V-002" : undefined,
      },
      {
        key: "idx",
        label: "Fila del contrato",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => `IF(${c("sale")}="","",IFERROR(MATCH(${c("sale")},${V("id")},0),""))`,
      },
      {
        key: "client",
        label: "Cliente",
        kind: "calc",
        resultKind: "text",
        formula: (c) => lookup("client", c("idx")),
      },
      {
        key: "lot",
        label: "Lote",
        kind: "calc",
        resultKind: "text",
        formula: (c) => lookup("lot", c("idx")),
      },
      {
        key: "price",
        label: "Precio",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => lookup("price", c("idx")),
      },
      {
        key: "down",
        label: "Prima",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => lookup("down", c("idx")),
      },
      {
        key: "financed",
        label: "Financiado",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => lookup("financed", c("idx")),
      },
      {
        key: "rate",
        label: "Tasa anual",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => lookup("rate", c("idx")),
      },
      {
        key: "term",
        label: "Plazo (meses)",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => lookup("term", c("idx")),
      },
      {
        key: "first",
        label: "Primera cuota",
        kind: "calc",
        resultKind: "date",
        formula: (c) => lookup("first", c("idx")),
      },
      {
        key: "payment",
        label: "Cuota mensual",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => lookup("payment", c("idx")),
      },
      {
        key: "paid",
        label: "Pagado en cuotas",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => lookup("paid", c("idx")),
      },
      {
        key: "late",
        label: "Atraso",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => lookup("late", c("idx")),
      },
    ],
    theme,
    ctx,
  });
  const F = (k: string) => sf.cell(k);
  const maxRows = Math.min(240, Math.max(term, 12));
  const sched = addTable(st, {
    startRow: 17,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 8,
        align: "center",
        formula: (r) => `IF(OR(${F("idx")}="",${r.index + 1}>N(${F("term")})),"",${r.index + 1})`,
      },
      {
        key: "date",
        header: "Fecha",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("n")}="",${F("first")}=""),"",EDATE(${F("first")},${r.index}))`,
      },
      {
        key: "pay",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("n")}="","",${F("payment")})`,
      },
      {
        key: "interest",
        header: "Interés",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("n")}="","",ROUND(${r.prev("balance") ?? F("financed")}*${F("rate")}/12,2))`,
      },
      {
        key: "capital",
        header: "Capital",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("n")}="","",${r.c("pay")}-${r.c("interest")})`,
      },
      {
        key: "balance",
        header: "Saldo de capital",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(${r.c("n")}="","",MAX(0,${r.prev("balance") ?? F("financed")}-${r.c("capital")}))`,
      },
      {
        key: "cum",
        header: "Debería llevar",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) => `IF(${r.c("n")}="","",${r.c("n")}*${F("payment")})`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(${r.c("n")}="","",IF(ROUND(${F("paid")},2)>=ROUND(${r.c("cum")},2),"Pagada",IF(TODAY()>${r.c("date")},"Vencida","Pendiente")))`,
      },
    ],
    rows: maxRows,
    theme,
    ctx,
    totals: { label: "Totales" },
  });
  const qCol = sched.letter("status");
  highlightWhen(
    st,
    `A${sched.firstRow}:${qCol}${sched.lastRow}`,
    `$${qCol}${sched.firstRow}="Vencida"`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    st,
    `${qCol}${sched.firstRow}:${qCol}${sched.lastRow}`,
    `${qCol}${sched.firstRow}="Pagada"`,
    { fill: theme.okSoft, bold: true },
    2,
  );

  // Resumen
  addSheetHeader(sum, {
    title: titleWith(`Resumen ${y}`, config.businessName),
    subtitle: "Lotes, cartera, morosidad, cobros y ventas.",
    theme,
    width: 6,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "lots",
        label: "Lotes registrados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${L("lot")},"<>")`,
      },
      {
        key: "free",
        label: "Lotes disponibles",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${L("status")},"Disponible")`,
      },
      {
        key: "reserved",
        label: "Lotes reservados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${L("status")},"Reservado")`,
      },
      {
        key: "sold",
        label: "Lotes vendidos",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${L("status")},"Vendido")`,
      },
      {
        key: "stock",
        label: "Valor de lotes disponibles",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${L("price")},${L("status")},"Disponible")`,
      },
    ],
    theme,
    ctx,
  });
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "sales",
        label: "Valor vendido",
        kind: "calc",
        resultKind: "currency",
        formula: () => vt.sheetTotal("price"),
      },
      {
        key: "down",
        label: "Primas cobradas",
        kind: "calc",
        resultKind: "currency",
        formula: () => vt.sheetTotal("down"),
      },
      {
        key: "collected",
        label: "Cobrado en cuotas",
        kind: "calc",
        resultKind: "currency",
        formula: () => pt.sheetTotal("amount"),
      },
      {
        key: "portfolio",
        label: "Cartera por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => vt.sheetTotal("balance"),
      },
      {
        key: "late",
        label: "Monto en atraso",
        kind: "calc",
        resultKind: "currency",
        formula: () => vt.sheetTotal("late"),
      },
      {
        key: "lateCount",
        label: "Contratos atrasados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${V("status")},"Atrasado")`,
      },
      {
        key: "rate",
        label: "Morosidad (atraso ÷ cartera)",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `IF(N(${c("portfolio")})=0,0,${c("late")}/${c("portfolio")})`,
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(1).width = 28;
  sum.getColumn(4).width = 28;
  const inMonth = (col: string, s?: string, e?: string) => `${col},">="&${s},${col},"<="&${e}`;
  addMonthlySummary(sum, {
    startRow: 12,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Lotes vendidos",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(V("date"), k.monthStart, k.monthEnd)},${V("client")},"<>")`,
      },
      {
        header: "Valor vendido",
        kind: "currency",
        formula: (k) => `SUMIFS(${V("price")},${inMonth(V("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Primas",
        kind: "currency",
        formula: (k) => `SUMIFS(${V("down")},${inMonth(V("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Cuotas cobradas",
        kind: "currency",
        formula: (k) => `SUMIFS(${P("amount")},${inMonth(P("date"), k.monthStart, k.monthEnd)})`,
      },
    ],
  });

  for (const w of [lots, sales, pays, st, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Venta de lotes a plazos",
    description: "Controla lotes, contratos, cuotas y mora de tu proyecto en un solo archivo.",
    steps: [
      `En Lotes escribe cada lote con su bloque y área en ${config.unit} cuadradas; el precio por ${unit} ya viene lleno y puedes cambiarlo por lote.`,
      "En Contratos registra cada venta: cliente, lote, prima, tasa, plazo y fecha de la primera cuota. La cuota mensual se calcula sola.",
      "En Pagos anota cada pago con su número de contrato (V-001, V-002…): se suman al contrato y se calcula el atraso.",
      "En Estado de cuenta elige un contrato para imprimir su tabla de cuotas pagadas, pendientes y vencidas.",
      "El Resumen muestra lotes disponibles, cartera, morosidad y cobros del año por mes.",
    ],
    tips: [
      "Para ventas sin intereses deja la tasa en 0 %: la cuota será el financiado dividido entre el plazo.",
      "Filtra Contratos por Estado = Atrasado para tu ruta de cobro.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 1);
  return wb;
};
