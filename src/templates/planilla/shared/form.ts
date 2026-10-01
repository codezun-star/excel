import { z } from "zod";

import type { FormFieldDef } from "@/templates/types";
import { SECTION_BUSINESS, SECTION_CONTENT } from "@/templates/shared/fields";
import { taxIdText } from "@/templates/shared/schema";

/** Campos comunes a las plantillas de planilla. */
export const payrollShape = {
  taxId: taxIdText,
  socialSecurity: z.array(z.string().max(40)).max(10),
  includeIncomeTax: z.boolean(),
};

export function payrollFields(): FormFieldDef[] {
  return [
    {
      type: "text",
      name: "taxId",
      label: "RTN del patrono",
      taxId: true,
      maxLength: 25,
      section: SECTION_BUSINESS,
      profileKey: "rtn",
    },
    {
      type: "multiselect",
      name: "socialSecurity",
      label: "Deducciones de seguridad social",
      options: (ctx) =>
        ctx.taxes.socialSecurity
          .filter((s) => s.employeeRate > 0)
          .map((s) => ({ value: s.id, label: s.label })),
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "switch",
      name: "includeIncomeTax",
      label: "Calcular retención de ISR",
      description: "Con la tabla progresiva vigente y la deducción de gastos médicos.",
      section: SECTION_CONTENT,
    },
  ];
}

export const EXAMPLE_EMPLOYEES = [
  { name: "María José Flores", dni: "0801-1990-01234", position: "Cajera", salary: 13_500 },
  { name: "Carlos Antonio Reyes", dni: "0501-1985-04567", position: "Bodeguero", salary: 15_200 },
  { name: "Ana Lucía Martínez", dni: "0801-1992-07788", position: "Contadora", salary: 38_000 },
  { name: "José Ramón Castillo", dni: "1804-1988-00321", position: "Gerente", salary: 85_000 },
];
