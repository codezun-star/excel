import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { addAmortization } from "@/templates/shared/amortization";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ViviendaConfig } from "./form";

export const build: TemplateBuild<ViviendaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Préstamo de vivienda", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Préstamo de vivienda", { tabColor: theme.primary });
  [12, 18, 16, 3, 14, 18, 16, 15, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  addSheetHeader(ws, {
    title: config.businessName || "Préstamo de vivienda",
    subtitle: "Simulación de crédito hipotecario.",
    theme,
    width: 9,
  });
  const home = addFields(ws, {
    startRow: 4,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    title: "La vivienda",
    fields: [
      { key: "value", label: "Valor de la vivienda", kind: "currency", value: config.homeValue },
    ],
    theme,
    ctx,
  });
  const loan = addAmortization(ws, {
    startRow: home.nextRow + 1,
    maxRows: 360,
    theme,
    ctx,
    includeInsurance: true,
    includeExtra: true,
    labels: { amount: "Monto a financiar" },
    values: {
      amount: config.amount,
      annualRate: config.annualRate / 100,
      months: config.months,
      firstPayment: config.firstPayment || null,
      method: config.method,
      insurance: config.insurance,
      extra: config.example ? 2000 : config.extra,
    },
  });
  addFields(ws, {
    startRow: 4,
    labelCol: 5,
    valueCol: 7,
    labelSpan: 2,
    title: "Prima",
    fields: [
      {
        key: "down",
        label: "Prima (valor − financiado)",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${home.cell("value")}-${loan.inputs.cell("amount")}`,
      },
      {
        key: "downPct",
        label: "Prima como % del valor",
        kind: "calc",
        resultKind: "percent",
        formula: (r) => `IFERROR(${r("down")}/${home.cell("value")},0)`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);
  addInstructionsSheet(wb, {
    title: "Préstamo de vivienda",
    description:
      "Simula tu crédito hipotecario: cuota, seguros, intereses totales y efecto de abonar extra a capital.",
    steps: [
      "Escribe el valor de la vivienda y el monto que financiará el banco; la prima se calcula sola.",
      "Escribe la tasa anual, el plazo en meses (240 = 20 años) y la fecha del primer pago.",
      "Agrega los seguros mensuales que cobra el banco para ver tu pago total.",
      "Prueba abonos extra mensuales: el plazo y los intereses totales bajan.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
