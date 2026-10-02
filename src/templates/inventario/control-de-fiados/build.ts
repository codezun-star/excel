import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { FiadosConfig } from "./form";

export const build: TemplateBuild<FiadosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Control de fiados", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Clientes", { freezeRows: 7, tabColor: theme.primary });
  const mov = addSheet(wb, "Movimientos", { freezeRows: 4, tabColor: theme.primary });
  const clientStart = 7;
  const names = sheetRef(
    ws.name,
    rangeAddr(1, clientStart + 1, 1, clientStart + config.clients, true),
  );

  addSheetHeader(mov, {
    title: "Fiados y abonos",
    subtitle: "Registra cada fiado o abono con el nombre del cliente.",
    theme,
    width: 5,
  });
  const ex = config.example;
  const movements = addTable(mov, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "list", width: 26, list: { source: names } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Fiado", "Abono"],
        align: "center",
      },
      { key: "detail", header: "Detalle", kind: "text", width: 32 },
      { key: "amount", header: "Monto", kind: "currency", width: 14 },
    ],
    rows: config.movements,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: "2026-03-01",
            client: "Doña Rosa Martínez",
            type: "Fiado",
            detail: "Arroz, frijoles y aceite",
            amount: 285,
          },
          {
            date: "2026-03-04",
            client: "Don Juan Pérez",
            type: "Fiado",
            detail: "Gaseosas y pan",
            amount: 160,
          },
          {
            date: "2026-03-08",
            client: "Doña Rosa Martínez",
            type: "Abono",
            detail: "Abono en efectivo",
            amount: 200,
          },
          {
            date: "2026-03-09",
            client: "Don Juan Pérez",
            type: "Fiado",
            detail: "Compra de la semana",
            amount: 980,
          },
        ]
      : undefined,
  });
  const t = movements.sheetRange("type");
  const c = movements.sheetRange("client");
  const a = movements.sheetRange("amount");

  addSheetHeader(ws, {
    title: titleWith("Control de fiados", config.businessName),
    subtitle: "El saldo de cada cliente se calcula con sus fiados y abonos.",
    theme,
    width: 7,
  });
  const table = addTable(ws, {
    startRow: clientStart,
    columns: [
      { key: "name", header: "Cliente", kind: "text", width: 26 },
      { key: "phone", header: "Teléfono", kind: "text", width: 14 },
      {
        key: "limit",
        header: "Límite de crédito",
        kind: "currency",
        width: 14,
        fill: config.defaultLimit,
      },
      {
        key: "credit",
        header: "Total fiado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) => `IF(${r.c("name")}="","",SUMIFS(${a},${c},${r.c("name")},${t},"Fiado"))`,
      },
      {
        key: "paid",
        header: "Total abonado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) => `IF(${r.c("name")}="","",SUMIFS(${a},${c},${r.c("name")},${t},"Abono"))`,
      },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${r.c("credit")}-${r.c("paid")})`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 15,
        align: "center",
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(${r.c("balance")}>${r.c("limit")},"Pasó su límite",IF(${r.c("balance")}>0,"Debe","Al día")))`,
      },
    ],
    rows: config.clients,
    theme,
    ctx,
    example: ex
      ? [
          { name: "Doña Rosa Martínez", phone: "9876-5432" },
          { name: "Don Juan Pérez", phone: "3344-5566" },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "total",
        label: "Total por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `SUM(${table.range("balance")})`,
      },
      {
        key: "count",
        label: "Clientes con saldo",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${table.range("balance")},">0")`,
      },
    ],
    theme,
    ctx,
  });
  const st = `$${table.letter("status")}${table.firstRow}`;
  highlightWhen(
    ws,
    `A${table.firstRow}:G${table.lastRow}`,
    `${st}="Pasó su límite"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(
    ws,
    `G${table.firstRow}:G${table.lastRow}`,
    `G${table.firstRow}="Al día"`,
    { fill: theme.okSoft },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Control de fiados",
    description: "Reemplaza el cuaderno de fiados: sabe al instante cuánto te debe cada cliente.",
    steps: [
      "En Clientes escribe el nombre, el teléfono y el límite de crédito de cada cliente.",
      "En Movimientos registra cada fiado y cada abono eligiendo al cliente de la lista.",
      "El saldo de cada cliente y el total por cobrar se calculan solos.",
      "Los clientes que pasan su límite de crédito se marcan en rojo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
