import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { ServiciosConfig } from "./form";

export const build: TemplateBuild<ServiciosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith(`Pagos de servicios ${config.year}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Servicios", { freezeRows: 8, tabColor: theme.primary, landscape: true });
  const ex = config.example;

  addSheetHeader(ws, {
    title,
    subtitle: "Escribe lo que pagaste cada mes. El estado del mes actual se calcula solo.",
    theme,
    width: 22,
  });
  const f = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: config.year }],
    theme,
    ctx,
  });
  const Y = f.cell("year");
  const monthKeys = SHORT_MONTHS.map((_, i) => `m${i}`);
  const monthCols: ColumnDef[] = SHORT_MONTHS.map((m, i) => ({
    key: monthKeys[i]!,
    header: m,
    kind: "currency",
    width: 10,
    total: "sum",
  }));
  const sample: Record<string, Record<string, number>> = {
    "Energía eléctrica": { m0: 1180, m1: 1250, m2: 1320 },
    Agua: { m0: 280, m1: 280, m2: 300 },
    Internet: { m0: 950, m1: 950, m2: 950 },
  };
  const due: Record<string, number> = { "Energía eléctrica": 15, Agua: 20, Internet: 5 };
  const table = addTable(ws, {
    startRow: 8,
    headerHeight: 32,
    columns: [
      { key: "service", header: "Servicio", kind: "text", width: 20 },
      { key: "provider", header: "Proveedor", kind: "text", width: 16 },
      { key: "contract", header: "N.º de contrato o cliente", kind: "text", width: 15 },
      {
        key: "day",
        header: "Día de vencimiento",
        kind: "integer",
        width: 10,
        min: 1,
        align: "center",
      },
      ...monthCols,
      {
        key: "total",
        header: "Total del año",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("service")}="","",SUM(${r.c(monthKeys[0]!)}:${r.c(monthKeys[11]!)}))`,
      },
      {
        key: "avg",
        header: "Promedio mensual",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("service")}="",COUNT(${r.c(monthKeys[0]!)}:${r.c(monthKeys[11]!)})=0),"",ROUND(AVERAGE(${r.c(monthKeys[0]!)}:${r.c(monthKeys[11]!)}),2))`,
      },
      {
        key: "status",
        header: "Este mes",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("service")}="",${Y}<>YEAR(TODAY())),"",IF(N(INDEX(${r.c(monthKeys[0]!)}:${r.c(monthKeys[11]!)},1,MONTH(TODAY())))>0,"Pagado",IF(AND(${r.c("day")}<>"",DAY(TODAY())>N(${r.c("day")})),"Vencido","Pendiente")))`,
      },
    ],
    rows: config.services.length + 5,
    theme,
    ctx,
    totals: { label: "Total por mes" },
    example: config.services.map((service) => ({
      service,
      ...(ex ? { day: due[service], ...(sample[service] ?? {}) } : {}),
    })),
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "total",
        label: "Gastado en el año",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("total"),
      },
      {
        key: "pending",
        label: "Servicios pendientes este mes",
        kind: "calc",
        resultKind: "integer",
        formula: () =>
          `COUNTIF(${table.range("status")},"Pendiente")+COUNTIF(${table.range("status")},"Vencido")`,
      },
    ],
    theme,
    ctx,
  });
  const s = table.letter("status");
  highlightWhen(
    ws,
    `${s}${table.firstRow}:${s}${table.lastRow}`,
    `${s}${table.firstRow}="Vencido"`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
    1,
  );
  highlightWhen(
    ws,
    `${s}${table.firstRow}:${s}${table.lastRow}`,
    `${s}${table.firstRow}="Pagado"`,
    { fill: theme.okSoft },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Pagos de servicios del hogar",
    description: "No vuelvas a pagar recargos: mira qué servicio vence y cuánto gastas al año.",
    steps: [
      "Completa proveedor, número de contrato y día de vencimiento de cada servicio.",
      "Cada mes escribe lo que pagaste en la columna del mes.",
      "La columna «Este mes» te dice si ya pagaste, si está pendiente o si ya se venció.",
      "Abajo ves el total por mes y a la derecha el total y el promedio por servicio.",
    ],
    tips: [
      "Compara el promedio mensual con el recibo actual: un salto grande puede ser una fuga de agua o un error de lectura.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
