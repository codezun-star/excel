import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, styleTotal } from "@/lib/excel/styles";
import { addTable, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { ConsignacionConfig } from "./form";

const PRODUCTS = 200;
const PARTNERS = 50;
const SALE = "Venta";
const RETURN = "Devolución";
const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Depósito", "Cheque"];

/** Rango absoluto con hoja de las columnas `from`..`to` de una tabla. */
function block(t: TableRef, from: string, to: string): string {
  return sheetRef(
    t.ws.name,
    rangeAddr(t.colNumber(from), t.firstRow, t.colNumber(to), t.lastRow, true),
  );
}

export const build: TemplateBuild<ConsignacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const giving = config.mode === "entrego";
  const IN = giving ? "Entrega" : "Recepción";
  const partner = giving ? "Consignatario" : "Proveedor";
  const partnerSheet = giving ? "Consignatarios" : "Proveedores";
  const settleHeader = giving ? "Te debe" : "Le debes";
  const balanceLabel = giving ? "Saldo por cobrar" : "Saldo por pagar";
  const title = titleWith("Mercadería en consignación", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Movimientos", {
    freezeRows: 10,
    landscape: true,
    tabColor: theme.primary,
  });
  const wsPartners = addSheet(wb, partnerSheet, {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const wsProducts = addSheet(wb, "Productos", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const wsPayments = addSheet(wb, "Liquidaciones", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;

  // Catálogos (columnas de captura)
  addSheetHeader(wsProducts, {
    title: "Productos",
    subtitle: "Código, nombre y precio de venta al público. Las existencias se calculan solas.",
    theme,
    width: 10,
  });
  const products = addTable(wsProducts, {
    startRow: 4,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 11 },
      { key: "name", header: "Producto", kind: "text", width: 30 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 14 },
    ],
    rows: PRODUCTS,
    theme,
    ctx,
    example: ex
      ? [
          { code: "CAM-01", name: "Camisa polo", price: 450 },
          { code: "PAN-01", name: "Pantalón de lona", price: 850 },
          { code: "GOR-01", name: "Gorra bordada", price: 250 },
        ]
      : undefined,
  });
  addSheetHeader(wsPartners, {
    title: partnerSheet,
    subtitle: giving
      ? "Tiendas o revendedores que venden tu mercadería y la comisión que se quedan."
      : "Proveedores que te dejan mercadería y la comisión que ganas por vender.",
    theme,
    width: 13,
  });
  const partners = addTable(wsPartners, {
    startRow: 4,
    columns: [
      { key: "name", header: partner, kind: "text", width: 26 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      {
        key: "pct",
        header: giving ? "Comisión del consignatario" : "Tu comisión",
        kind: "percent",
        width: 12,
        fill: config.commission / 100,
      },
    ],
    rows: PARTNERS,
    theme,
    ctx,
    example: ex
      ? [
          { name: "Tienda La Moda", phone: "9988-1122", pct: 0.2 },
          { name: "Boutique Estilo", phone: "3344-5566", pct: 0.25 },
        ]
      : undefined,
  });
  const PR = block(products, "code", "price");
  const PA = block(partners, "name", "pct");

  addSheetHeader(wsPayments, {
    title: giving ? "Liquidaciones cobradas" : "Liquidaciones pagadas",
    subtitle: giving
      ? "Lo que te pagan las tiendas por la mercadería vendida."
      : "Lo que le pagas a cada proveedor por la mercadería vendida.",
    theme,
    width: 5,
  });
  const payments = addTable(wsPayments, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "partner",
        header: partner,
        kind: "list",
        width: 26,
        list: { source: partners.sheetRange("name") },
      },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      { key: "method", header: "Forma de pago", kind: "list", width: 15, list: PAYMENT_METHODS },
      { key: "ref", header: "Referencia", kind: "text", width: 20 },
    ],
    rows: 500,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: fromToday(-1),
            partner: "Tienda La Moda",
            amount: 2880,
            method: "Transferencia",
            ref: "BAC-55123",
          },
        ]
      : undefined,
  });
  await protectSheet(wsPayments);

  // Movimientos
  addSheetHeader(ws, {
    title,
    subtitle: `${IN}: mercadería que sale a consignación · ${SALE}: lo que se vendió · ${RETURN}: lo que regresa sin vender.`,
    theme,
    width: 13,
  });
  const moves = addTable(ws, {
    startRow: 10,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 11 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 12,
        list: [IN, SALE, RETURN],
        align: "center",
      },
      {
        key: "partner",
        header: partner,
        kind: "list",
        width: 22,
        list: { source: partners.sheetRange("name") },
      },
      {
        key: "code",
        header: "Código",
        kind: "list",
        width: 10,
        list: { source: products.sheetRange("code") },
      },
      {
        key: "product",
        header: "Producto",
        kind: "formula",
        width: 24,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(VLOOKUP(${r.c("code")},${PR},2,0),"Código no existe"))`,
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 9 },
      {
        key: "listPrice",
        header: "Precio de lista",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(${r.c("code")}="","",IFERROR(VLOOKUP(${r.c("code")},${PR},3,0),0))`,
      },
      {
        key: "salePrice",
        header: "Precio vendido (si cambió)",
        kind: "currency",
        width: 12,
        note: "Solo en ventas a un precio distinto al de lista. Déjalo vacío para usar el precio de lista.",
      },
      {
        key: "amount",
        header: "Monto vendido",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("type")}<>"${SALE}",${r.c("qty")}="",${r.c("code")}=""),"",ROUND(${r.c("qty")}*IF(${r.c("salePrice")}="",${r.c("listPrice")},${r.c("salePrice")}),2))`,
      },
      {
        key: "commission",
        header: "Comisión",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("amount")}="","",ROUND(${r.c("amount")}*IFERROR(VLOOKUP(${r.c("partner")},${PA},3,0),0),2))`,
      },
      {
        key: "settle",
        header: settleHeader,
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("amount")}="","",${r.c("amount")}-${r.c("commission")})`,
      },
      { key: "doc", header: "Guía o nota", kind: "text", width: 14 },
      {
        key: "stock",
        header: "Efecto en consignación (precio de lista)",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        note: "Suma en las entregas y resta en las ventas y devoluciones: es el valor que queda en consignación.",
        formula: (r) =>
          `IF(OR(${r.c("code")}="",${r.c("qty")}=""),"",ROUND(${r.c("qty")}*${r.c("listPrice")}*IF(${r.c("type")}="${IN}",1,IF(OR(${r.c("type")}="${SALE}",${r.c("type")}="${RETURN}"),-1,0)),2))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 36,
    example: ex
      ? [
          {
            date: fromToday(-20),
            type: IN,
            partner: "Tienda La Moda",
            code: "CAM-01",
            qty: 20,
            doc: "G-001",
          },
          {
            date: fromToday(-20),
            type: IN,
            partner: "Tienda La Moda",
            code: "PAN-01",
            qty: 10,
            doc: "G-001",
          },
          {
            date: fromToday(-18),
            type: IN,
            partner: "Boutique Estilo",
            code: "GOR-01",
            qty: 30,
            doc: "G-002",
          },
          { date: fromToday(-7), type: SALE, partner: "Tienda La Moda", code: "CAM-01", qty: 8 },
          { date: fromToday(-7), type: SALE, partner: "Tienda La Moda", code: "PAN-01", qty: 3 },
          { date: fromToday(-5), type: RETURN, partner: "Tienda La Moda", code: "CAM-01", qty: 2 },
          {
            date: fromToday(-3),
            type: SALE,
            partner: "Boutique Estilo",
            code: "GOR-01",
            qty: 12,
            salePrice: 225,
            doc: "Promoción",
          },
        ]
      : undefined,
  });
  const M = (key: string) => moves.sheetRange(key);
  const unitsBy = (field: string, key: string, type: string) =>
    `SUMIFS(${M("qty")},${M(field)},${key},${M("type")},"${type}")`;

  // Resumen por consignatario o proveedor (a la derecha de sus datos)
  const partnerSummary = addTable(wsPartners, {
    startRow: 4,
    startCol: partners.colNumber("pct") + 1,
    columns: [
      { key: "in", header: giving ? "Unidades entregadas" : "Unidades recibidas" },
      { key: "sold", header: "Unidades vendidas" },
      { key: "ret", header: "Unidades devueltas" },
      { key: "onHand", header: "Unidades en consignación" },
      { key: "sales", header: "Ventas" },
      { key: "commission", header: "Comisión" },
      { key: "settle", header: settleHeader },
      { key: "paid", header: giving ? "Cobrado" : "Pagado" },
      { key: "balance", header: balanceLabel },
      { key: "value", header: "Valor en consignación" },
    ].map(({ key, header }) => {
      const units = ["in", "sold", "ret", "onHand"].includes(key);
      return {
        key,
        header,
        kind: "formula" as const,
        resultKind: units ? ("number" as const) : ("currency" as const),
        width: 13,
        total: "sum" as const,
        formula: (r: { row: number; c: (k: string) => string }) => {
          const name = partners.cell("name", r.row);
          const f: Record<string, string> = {
            in: unitsBy("partner", name, IN),
            sold: unitsBy("partner", name, SALE),
            ret: unitsBy("partner", name, RETURN),
            onHand: `${r.c("in")}-${r.c("sold")}-${r.c("ret")}`,
            sales: `SUMIFS(${M("amount")},${M("partner")},${name})`,
            commission: `SUMIFS(${M("commission")},${M("partner")},${name})`,
            settle: `SUMIFS(${M("settle")},${M("partner")},${name})`,
            paid: `SUMIFS(${payments.sheetRange("amount")},${payments.sheetRange("partner")},${name})`,
            balance: `${r.c("settle")}-${r.c("paid")}`,
            value: `SUMIFS(${M("stock")},${M("partner")},${name})`,
          };
          return `IF(${name}="","",${f[key]})`;
        },
      };
    }),
    rows: PARTNERS,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 36,
  });
  const pTotals = wsPartners.getCell(partnerSummary.totalRow!, 1);
  pTotals.value = "Totales";
  for (const key of ["name", "phone", "pct"])
    styleTotal(wsPartners.getCell(partnerSummary.totalRow!, partners.colNumber(key)), theme);
  await protectSheet(wsPartners);

  // Existencias por producto (a la derecha del catálogo)
  const productSummary = addTable(wsProducts, {
    startRow: 4,
    startCol: products.colNumber("price") + 1,
    columns: [
      { key: "in", header: giving ? "Unidades entregadas" : "Unidades recibidas" },
      { key: "sold", header: "Unidades vendidas" },
      { key: "ret", header: "Unidades devueltas" },
      { key: "onHand", header: "Unidades en consignación" },
      { key: "value", header: "Valor en consignación" },
      { key: "sales", header: "Ventas" },
    ].map(({ key, header }) => {
      const units = ["in", "sold", "ret", "onHand"].includes(key);
      return {
        key,
        header,
        kind: "formula" as const,
        resultKind: units ? ("number" as const) : ("currency" as const),
        width: 13,
        total: "sum" as const,
        formula: (r: { row: number; c: (k: string) => string }) => {
          const code = products.cell("code", r.row);
          const f: Record<string, string> = {
            in: unitsBy("code", code, IN),
            sold: unitsBy("code", code, SALE),
            ret: unitsBy("code", code, RETURN),
            onHand: `${r.c("in")}-${r.c("sold")}-${r.c("ret")}`,
            value: `ROUND(${r.c("onHand")}*N(${products.cell("price", r.row)}),2)`,
            sales: `SUMIFS(${M("amount")},${M("code")},${code})`,
          };
          return `IF(${code}="","",${f[key]})`;
        },
      };
    }),
    rows: PRODUCTS,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 36,
  });
  wsProducts.getCell(productSummary.totalRow!, 1).value = "Totales";
  for (const key of ["code", "name", "price"])
    styleTotal(wsProducts.getCell(productSummary.totalRow!, products.colNumber(key)), theme);
  highlightWhen(
    wsProducts,
    `${productSummary.letter("onHand")}${productSummary.firstRow}:${productSummary.letter("onHand")}${productSummary.lastRow}`,
    `AND(${productSummary.letter("onHand")}${productSummary.firstRow}<>"",${productSummary.letter("onHand")}${productSummary.firstRow}<0)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
  );
  await protectSheet(wsProducts);

  // Resumen y consulta en Movimientos
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 4,
    labelSpan: 3,
    valueSpan: 2,
    title: "Resumen",
    fields: [
      {
        key: "units",
        label: "Unidades en consignación",
        kind: "calc",
        resultKind: "number",
        formula: () => partnerSummary.sheetTotal("onHand"),
      },
      {
        key: "value",
        label: "Valor en consignación (precio de lista)",
        kind: "calc",
        resultKind: "currency",
        formula: () => partnerSummary.sheetTotal("value"),
      },
      {
        key: "sales",
        label: "Ventas reportadas",
        kind: "calc",
        resultKind: "currency",
        formula: () => moves.total("amount"),
      },
      {
        key: "balance",
        label: balanceLabel,
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => partnerSummary.sheetTotal("balance"),
      },
    ],
    theme,
    ctx,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 8,
    valueCol: 10,
    labelSpan: 2,
    valueSpan: 3,
    title: "Consulta: ¿cuánto hay en cada lugar?",
    fields: [
      {
        key: "partner",
        label: partner,
        kind: "list",
        list: { source: partners.sheetRange("name") },
        value: ex ? "Tienda La Moda" : null,
      },
      {
        key: "code",
        label: "Código del producto",
        kind: "list",
        list: { source: products.sheetRange("code") },
        value: ex ? "CAM-01" : null,
      },
      {
        key: "product",
        label: "Producto",
        kind: "calc",
        formula: (ref) =>
          `IF(${ref("code")}="","",IFERROR(VLOOKUP(${ref("code")},${PR},2,0),"Código no existe"))`,
      },
      {
        key: "units",
        label: "Unidades en consignación",
        kind: "calc",
        resultKind: "number",
        emphasis: true,
        formula: (ref) => {
          const by = (type: string) =>
            `SUMIFS(${M("qty")},${M("partner")},${ref("partner")},${M("code")},${ref("code")},${M("type")},"${type}")`;
          return `IF(OR(${ref("partner")}="",${ref("code")}=""),"",${by(IN)}-${by(SALE)}-${by(RETURN)})`;
        },
      },
      {
        key: "value",
        label: "Valor (precio de lista)",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) =>
          `IF(${ref("units")}="","",${ref("units")}*IFERROR(VLOOKUP(${ref("code")},${PR},3,0),0))`,
      },
    ],
    theme,
    ctx,
  });
  const product = `${moves.letter("product")}${moves.firstRow}`;
  highlightWhen(
    ws,
    `${moves.letter("product")}${moves.firstRow}:${moves.letter("product")}${moves.lastRow}`,
    `${product}="Código no existe"`,
    { fill: theme.dangerSoft, color: theme.danger },
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Mercadería en consignación",
    description: giving
      ? "Sabe cuánta mercadería tienes en cada tienda, cuánto vendieron y cuánto te deben."
      : "Sabe cuánta mercadería de cada proveedor tienes, cuánto vendiste y cuánto le debes.",
    steps: [
      "En Productos escribe el código, el nombre y el precio de venta de cada artículo.",
      `En ${partnerSheet} escribe cada ${partner.toLowerCase()} con su porcentaje de comisión.`,
      `En Movimientos registra cada ${IN.toLowerCase()}, cada ${SALE.toLowerCase()} reportada y cada ${RETURN.toLowerCase()}: fecha, ${partner.toLowerCase()}, código y cantidad.`,
      "El monto vendido, la comisión y lo que se debe se calculan solos. Si se vendió a otro precio, escríbelo en «Precio vendido».",
      `Cuando ${giving ? "te paguen" : "pagues"}, registra la liquidación: el saldo de cada ${partner.toLowerCase()} baja solo.`,
      "Usa la Consulta de arriba para saber cuántas unidades de un producto hay en cada lugar.",
    ],
    sheets: [
      { name: "Movimientos", description: `${IN}s, ventas y devoluciones.` },
      { name: partnerSheet, description: "Comisión, unidades, ventas y saldo de cada uno." },
      { name: "Productos", description: "Precios y existencias en consignación por producto." },
      { name: "Liquidaciones", description: giving ? "Pagos recibidos." : "Pagos realizados." },
    ],
    tips: [
      "Haz un corte (liquidación) cada semana o quincena y revisa juntos las unidades en consignación.",
      "Si una existencia queda negativa en Productos se marca en rojo: falta registrar una entrega o sobra una venta.",
      "Si cambias el precio de lista, el valor en consignación se actualiza; las ventas a otro precio usan «Precio vendido».",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
