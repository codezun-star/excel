import { addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import { ACCOUNT_TYPES, BASE_ACCOUNTS } from "../shared/accounts";
import type { CatalogoConfig } from "./form";

export const build: TemplateBuild<CatalogoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Catálogo de cuentas", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Catálogo", { freezeRows: 4, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [],
    tables: [
      {
        key: "types",
        title: "Grupos de cuentas",
        columns: [
          { header: "Primer dígito", kind: "integer" },
          { header: "Tipo", kind: "text" },
          { header: "Naturaleza", kind: "text" },
          { header: "Estado financiero", kind: "text", width: 22 },
        ],
        rows: ACCOUNT_TYPES.map((t) => [Number(t.digit), t.type, t.nature, t.statement]),
      },
    ],
  });
  const types = params.table("types");
  addSheetHeader(ws, {
    title: titleWith("Catálogo de cuentas", config.businessName),
    subtitle:
      "El nivel, el tipo, la naturaleza y el estado financiero se calculan a partir del código.",
    theme,
    width: 6,
  });
  const table = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 12 },
      { key: "name", header: "Nombre de la cuenta", kind: "text", width: 44 },
      {
        key: "level",
        header: "Nivel",
        kind: "formula",
        resultKind: "integer",
        width: 7,
        align: "center",
        formula: (r) =>
          `IF(${r.c("code")}="","",IF(LEN(${r.c("code")})=1,1,IF(LEN(${r.c("code")})=2,2,IF(LEN(${r.c("code")})<=4,3,4))))`,
      },
      {
        key: "type",
        header: "Tipo",
        kind: "formula",
        width: 13,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(VLOOKUP(VALUE(LEFT(${r.c("code")},1)),${types},2,0),""))`,
      },
      {
        key: "nature",
        header: "Naturaleza",
        kind: "formula",
        width: 12,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(VLOOKUP(VALUE(LEFT(${r.c("code")},1)),${types},3,0),""))`,
      },
      {
        key: "statement",
        header: "Estado financiero",
        kind: "formula",
        width: 20,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(VLOOKUP(VALUE(LEFT(${r.c("code")},1)),${types},4,0),""))`,
      },
    ],
    rows: BASE_ACCOUNTS.length + config.spareRows,
    theme,
    ctx,
    autoFilter: true,
    example: BASE_ACCOUNTS.map(([code, name]) => ({ code, name })),
  });
  const lvl = `$${table.letter("level")}${table.firstRow}`;
  const area = `A${table.firstRow}:F${table.lastRow}`;
  highlightWhen(ws, area, `${lvl}=1`, { fill: theme.soft, bold: true }, 1);
  highlightWhen(ws, area, `${lvl}=2`, { bold: true }, 2);
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Catálogo de cuentas",
    description:
      "Base para organizar la contabilidad de tu empresa. Adáptalo a tu actividad con ayuda de tu contador.",
    steps: [
      "Revisa las cuentas incluidas y cambia los nombres que necesites.",
      "Agrega subcuentas en las filas libres con un código que empiece por el de la cuenta de mayor (por ejemplo 110301 para un banco).",
      "El nivel, el tipo, la naturaleza y el estado financiero se calculan solos según el código.",
      "Usa estos mismos códigos en el Libro diario y mayor.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
