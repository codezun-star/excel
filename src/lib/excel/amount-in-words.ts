import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { absAddr, formulaString, sheetRef } from "./refs";
import { addSheet } from "./sheet";

/**
 * Monto en letras (español) con fórmulas compatibles con Excel 2007+ y
 * Google Sheets, sin macros ni LAMBDA: se apoya en una hoja oculta "Letras"
 * con las palabras de 0 a 999 y combina millones, miles y unidades.
 */

const UNITS = [
  "",
  "UN",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISÉIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
  "VEINTE",
  "VEINTIÚN",
  "VEINTIDÓS",
  "VEINTITRÉS",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISÉIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];

const TENS = [
  "",
  "",
  "",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const HUNDREDS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

/** Palabras para 1..999 en forma apocopada ("UN", "VEINTIÚN", "CIENTO UN"). */
export function wordsUnder1000(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error(`Fuera de rango: ${n}`);
  if (n === 0) return "CERO";
  if (n === 100) return "CIEN";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]!);
  if (rest > 0) {
    if (rest < 30) parts.push(UNITS[rest]!);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u === 0 ? TENS[t]! : `${TENS[t]} Y ${UNITS[u]}`);
    }
  }
  return parts.join(" ");
}

/** Versión JavaScript (para la interfaz y para validar las fórmulas en tests). */
export function amountToWords(value: number, ctx: CountryContext): string {
  const rounded = Math.round(value * 100) / 100;
  const n = Math.floor(rounded);
  const cents = Math.round((rounded - n) * 100);
  if (n > 999_999_999) throw new Error("Monto demasiado grande para convertir a letras");
  const m = Math.floor(n / 1_000_000);
  const k = Math.floor((n % 1_000_000) / 1000);
  const u = n % 1000;
  let out = "";
  if (n === 0) out += "CERO ";
  if (m > 0) out += m === 1 ? "UN MILLÓN " : `${wordsUnder1000(m)} MILLONES `;
  if (k > 0) out += k === 1 ? "MIL " : `${wordsUnder1000(k)} MIL `;
  if (u > 0) out += `${wordsUnder1000(u)} `;
  if (m > 0 && k === 0 && u === 0) out += "DE ";
  out += n === 1 ? ctx.currency.name.singular : ctx.currency.name.plural;
  out += ` CON ${String(cents).padStart(2, "0")}/100`;
  return out;
}

const LOOKUP_SHEET = "Letras";

interface WordsState {
  ws: ExcelJS.Worksheet;
  nextRow: number;
}

const states = new WeakMap<ExcelJS.Workbook, WordsState>();

function ensureLookupSheet(wb: ExcelJS.Workbook): WordsState {
  const existing = states.get(wb);
  if (existing) return existing;
  const ws = addSheet(wb, LOOKUP_SHEET, { hidden: true });
  for (let i = 0; i <= 999; i++) {
    ws.getCell(i + 1, 1).value = wordsUnder1000(i);
  }
  ws.getColumn(1).width = 32;
  const state: WordsState = { ws, nextRow: 1 };
  states.set(wb, state);
  return state;
}

/**
 * Devuelve una referencia ("'Letras'!$I$1") cuyo valor es el monto en letras
 * de `amountRef` (p. ej. "'Factura'!$J$40"). Cada llamada usa una fila
 * auxiliar distinta de la hoja oculta.
 */
export function amountInWordsRef(
  wb: ExcelJS.Workbook,
  amountRef: string,
  ctx: CountryContext,
): string {
  const state = ensureLookupSheet(wb);
  const r = state.nextRow++;
  const ws = state.ws;
  const words = `$A$1:$A$1000`;
  const C = absAddr(3, r); // monto redondeado
  const D = absAddr(4, r); // parte entera
  const E = absAddr(5, r); // centavos
  const F = absAddr(6, r); // millones
  const G = absAddr(7, r); // miles
  const H = absAddr(8, r); // unidades
  const singular = formulaString(ctx.currency.name.singular);
  const plural = formulaString(ctx.currency.name.plural);

  ws.getCell(C).value = { formula: `IF(ISNUMBER(${amountRef}),ROUND(ABS(${amountRef}),2),0)` };
  ws.getCell(D).value = { formula: `INT(${C})` };
  ws.getCell(E).value = { formula: `ROUND((${C}-${D})*100,0)` };
  ws.getCell(F).value = { formula: `INT(${D}/1000000)` };
  ws.getCell(G).value = { formula: `INT(MOD(${D},1000000)/1000)` };
  ws.getCell(H).value = { formula: `MOD(${D},1000)` };
  ws.getCell(absAddr(9, r)).value = {
    formula:
      `IF(${D}=0,"CERO ","")` +
      `&IF(${F}=0,"",IF(${F}=1,"UN MILLÓN ",INDEX(${words},${F}+1)&" MILLONES "))` +
      `&IF(${G}=0,"",IF(${G}=1,"MIL ",INDEX(${words},${G}+1)&" MIL "))` +
      `&IF(${H}=0,"",INDEX(${words},${H}+1)&" ")` +
      `&IF(AND(${F}>0,${G}=0,${H}=0),"DE ","")` +
      `&IF(${D}=1,${singular},${plural})` +
      `&" CON "&TEXT(${E},"00")&"/100"`,
  };
  return sheetRef(ws.name, absAddr(9, r));
}
