import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { highlightWhen } from "@/lib/excel/conditional";
import type { SheetTheme } from "@/lib/excel/styles";
import { addTable, type CellInput, type ColumnDef, type TableRef } from "@/lib/excel/table";

/**
 * Matriz de miembros × meses (cuotas, mensualidades, aportes): monto pagado
 * por mes, total pagado, lo que debería llevar pagado al mes de corte y saldo.
 */
export interface MemberMatrixOptions {
  startRow: number;
  rows: number;
  months: string[];
  /** Celda con el número de meses vencidos al corte (1..n) */
  monthsDueCell: string;
  /** Columnas de identificación antes de los meses */
  leading: ColumnDef[];
  /** Clave de la columna con la cuota mensual de cada miembro */
  feeKey: string;
  /** Monto adicional que debe pagarse una sola vez (matrícula), opcional */
  oneTimeKey?: string;
  /** Columna donde se registra el pago de ese monto único */
  oneTimePaidKey?: string;
  theme: SheetTheme;
  ctx: CountryContext;
  example?: Array<Record<string, CellInput>>;
}

export function addMemberMatrix(ws: ExcelJS.Worksheet, opts: MemberMatrixOptions): TableRef {
  const monthKeys = opts.months.map((_, i) => `m${i}`);
  const nameKey = opts.leading[0]!.key;
  const table = addTable(ws, {
    startRow: opts.startRow,
    columns: [
      ...opts.leading,
      ...opts.months.map((m, i): ColumnDef => ({
        key: monthKeys[i]!,
        header: m,
        kind: "currency",
        width: 10,
        total: "sum",
      })),
      {
        key: "paid",
        header: "Total pagado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c(nameKey)}="","",SUM(${r.c(monthKeys[0]!)}:${r.c(monthKeys[monthKeys.length - 1]!)})${opts.oneTimePaidKey ? `+${r.c(opts.oneTimePaidKey)}` : ""})`,
      },
      {
        key: "due",
        header: "Debería llevar",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c(nameKey)}="","",${r.c(opts.feeKey)}*MIN(${opts.monthsDueCell},${opts.months.length})${opts.oneTimeKey ? `+${r.c(opts.oneTimeKey)}` : ""})`,
      },
      {
        key: "balance",
        header: "Saldo pendiente",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c(nameKey)}="","",MAX(0,${r.c("due")}-${r.c("paid")}))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) => `IF(${r.c(nameKey)}="","",IF(${r.c("balance")}<=0,"Al día","Moroso"))`,
      },
    ],
    rows: opts.rows,
    theme: opts.theme,
    ctx: opts.ctx,
    totals: { label: "Totales" },
    example: opts.example,
    headerHeight: 30,
  });
  const st = `$${table.letter("status")}${table.firstRow}`;
  const lastLetter = table.letter("status");
  highlightWhen(
    ws,
    `A${table.firstRow}:${lastLetter}${table.lastRow}`,
    `${st}="Moroso"`,
    { fill: opts.theme.dangerSoft },
    1,
  );
  highlightWhen(
    ws,
    `${lastLetter}${table.firstRow}:${lastLetter}${table.lastRow}`,
    `${lastLetter}${table.firstRow}="Al día"`,
    { fill: opts.theme.okSoft, bold: true },
    2,
  );
  return table;
}

export const SHORT_MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
