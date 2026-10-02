import type { BankAccount } from "./types";

/**
 * Bancos de Honduras donde se reciben transferencias y depósitos. Cada uno se
 * activa al definir su número de cuenta en variables de entorno:
 *
 *   BANK_BAC_ACCOUNT_NUMBER, BANK_BAC_ACCOUNT_HOLDER, BANK_BAC_ACCOUNT_TYPE, BANK_BAC_CURRENCY
 *   (igual con BANK_ATLANTIDA_* y BANK_PROMERICA_*)
 *
 * El titular cae por defecto en MANUAL_BANK_ACCOUNT_HOLDER. Para agregar otro
 * banco (Ficohsa, Occidente, Banpaís…), sumarlo a esta lista.
 */
export const HN_BANKS = [
  { id: "bac", name: "BAC Credomatic", env: "BANK_BAC" },
  { id: "atlantida", name: "Banco Atlántida", env: "BANK_ATLANTIDA" },
  { id: "promerica", name: "Banco Promerica", env: "BANK_PROMERICA" },
] as const;

export type BankId = (typeof HN_BANKS)[number]["id"];

export function isBankId(value: string): value is BankId {
  return HN_BANKS.some((b) => b.id === value);
}

export function bankName(id: string | null | undefined): string | null {
  return HN_BANKS.find((b) => b.id === id)?.name ?? null;
}

/** Cuentas configuradas (las que tienen número de cuenta). */
export function bankAccountsFromEnv(
  env: Record<string, string | undefined> = process.env,
): BankAccount[] {
  const defaultHolder = env.MANUAL_BANK_ACCOUNT_HOLDER?.trim() ?? "";
  return HN_BANKS.flatMap((bank) => {
    const number = env[`${bank.env}_ACCOUNT_NUMBER`]?.trim();
    if (!number) return [];
    const currency = env[`${bank.env}_CURRENCY`]?.trim().toUpperCase() === "USD" ? "USD" : "HNL";
    return [
      {
        id: bank.id,
        bankName: bank.name,
        accountNumber: number,
        accountHolder: env[`${bank.env}_ACCOUNT_HOLDER`]?.trim() || defaultHolder,
        accountType: env[`${bank.env}_ACCOUNT_TYPE`]?.trim() || "Cuenta de ahorro",
        currency,
      },
    ];
  });
}
