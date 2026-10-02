import { addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { addAmortization } from "@/templates/shared/amortization";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { SimuladorConfig } from "./form";

export const build: TemplateBuild<SimuladorConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Simulador de préstamo", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Préstamo", { tabColor: theme.primary });
  [12, 18, 16, 3, 14, 18, 16, 15].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  addSheetHeader(ws, {
    title: config.businessName || "Simulador de préstamo",
    subtitle: "Cambia el monto, la tasa o el plazo y la tabla se recalcula.",
    theme,
    width: 8,
  });
  addAmortization(ws, {
    startRow: 4,
    maxRows: Math.max(config.months, 12),
    theme,
    ctx,
    includeExtra: true,
    values: {
      amount: config.amount,
      annualRate: config.annualRate / 100,
      months: config.months,
      firstPayment: config.firstPayment || null,
      method: config.method,
      extra: config.example ? 1000 : config.extra,
    },
  });
  await protectSheet(ws);
  addInstructionsSheet(wb, {
    title: "Simulador de préstamos",
    description:
      "Conoce la cuota de un préstamo, cuánto pagarás de intereses y cómo cambian si abonas extra a capital.",
    steps: [
      "Escribe el monto, la tasa de interés anual, el plazo en meses y la fecha del primer pago.",
      "Elige cuota nivelada (igual todos los meses) o capital constante (cuota decreciente).",
      "La tabla muestra para cada mes el interés, el abono a capital y el saldo.",
      "Prueba un abono extra mensual: verás cuántas cuotas te ahorras y cuánto menos pagas de intereses.",
    ],
    tips: [
      "La tasa que informa el banco puede no incluir seguros ni comisiones; pregunta por la tasa efectiva anual.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
