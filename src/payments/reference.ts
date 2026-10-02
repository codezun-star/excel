import { randomInt } from "node:crypto";

import type { CheckoutItem } from "./types";

// Sin 0/O ni 1/I/L para que se pueda dictar por teléfono sin confusiones.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Referencia única para transferencias, p. ej. EXC-PRO-7K2M9Q. */
export function generateReference(item: CheckoutItem): string {
  const prefix = item.kind === "plan" ? (item.planCode === "pro" ? "PRO" : "NEG") : "TPL";
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `EXC-${prefix}-${code}`;
}
