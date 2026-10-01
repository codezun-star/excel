import type ExcelJS from "exceljs";

import { formulaString } from "./refs";

/**
 * ExcelJS guarda internamente las validaciones por dirección; al escribir el
 * archivo agrupa rangos. `add` acepta una celda o un rango ("D5:D104").
 */
interface DataValidationsStore {
  add(address: string, validation: ExcelJS.DataValidation): void;
  model: Record<string, ExcelJS.DataValidation | undefined>;
}

function store(ws: ExcelJS.Worksheet): DataValidationsStore {
  return (ws as unknown as { dataValidations: DataValidationsStore }).dataValidations;
}

export function getValidations(ws: ExcelJS.Worksheet): Record<string, ExcelJS.DataValidation> {
  const model = store(ws).model;
  return Object.fromEntries(
    Object.entries(model).filter((e): e is [string, ExcelJS.DataValidation] => Boolean(e[1])),
  );
}

export function addValidation(
  ws: ExcelJS.Worksheet,
  range: string,
  validation: ExcelJS.DataValidation,
): void {
  store(ws).add(range, validation);
}

/** Lista desplegable desde un rango ("'Listas'!$A$2:$A$20") */
export function listFromRange(
  ws: ExcelJS.Worksheet,
  range: string,
  source: string,
  title = "Valor no válido",
): void {
  addValidation(ws, range, {
    type: "list",
    allowBlank: true,
    formulae: [source],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: title,
    error: "Elige un valor de la lista desplegable.",
  });
}

/**
 * Lista desplegable con valores fijos. Excel limita la lista en línea a 255
 * caracteres; para listas largas usa listFromRange con una hoja "Listas".
 */
export function listInline(ws: ExcelJS.Worksheet, range: string, values: string[]): void {
  const joined = values.map((v) => v.replace(/,/g, " ")).join(",");
  if (joined.length > 250) {
    throw new Error("Lista demasiado larga para validación en línea; usa listFromRange");
  }
  addValidation(ws, range, {
    type: "list",
    allowBlank: true,
    formulae: [formulaString(joined)],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Valor no válido",
    error: "Elige un valor de la lista desplegable.",
  });
}

export function decimalMin(ws: ExcelJS.Worksheet, range: string, min = 0, message?: string): void {
  addValidation(ws, range, {
    type: "decimal",
    operator: "greaterThanOrEqual",
    allowBlank: true,
    formulae: [min],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Número no válido",
    error: message ?? `Escribe un número mayor o igual a ${min}.`,
  });
}

export function decimalBetween(
  ws: ExcelJS.Worksheet,
  range: string,
  min: number,
  max: number,
  message?: string,
): void {
  addValidation(ws, range, {
    type: "decimal",
    operator: "between",
    allowBlank: true,
    formulae: [min, max],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Número no válido",
    error: message ?? `Escribe un número entre ${min} y ${max}.`,
  });
}

export function wholeMin(ws: ExcelJS.Worksheet, range: string, min = 0): void {
  addValidation(ws, range, {
    type: "whole",
    operator: "greaterThanOrEqual",
    allowBlank: true,
    formulae: [min],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Número no válido",
    error: `Escribe un número entero mayor o igual a ${min}.`,
  });
}

export function dateValidation(ws: ExcelJS.Worksheet, range: string): void {
  addValidation(ws, range, {
    type: "date",
    operator: "greaterThan",
    allowBlank: true,
    formulae: [new Date(Date.UTC(1990, 0, 1))],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Fecha no válida",
    error: "Escribe una fecha válida (dd/mm/aaaa).",
    showInputMessage: true,
    promptTitle: "Fecha",
    prompt: "Formato dd/mm/aaaa",
  });
}
