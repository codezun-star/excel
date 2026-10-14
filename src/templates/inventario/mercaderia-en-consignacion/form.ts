import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { percentField, rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  mode: z.enum(["entrego", "recibo"]),
  commission: z.coerce.number({ error: "Escribe un porcentaje" }).min(0).max(100),
  rows: rowsCount(100, 10_000),
});

export type ConsignacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<ConsignacionConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, mode: "entrego", commission: 20, rows: 1000 },
  formFields: [
    nameField(),
    {
      type: "select",
      name: "mode",
      label: "¿Cómo trabajas la consignación?",
      options: [
        { value: "entrego", label: "Entrego mercadería a tiendas o revendedores" },
        { value: "recibo", label: "Recibo mercadería de proveedores para venderla" },
      ],
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    percentField(
      "commission",
      "Comisión habitual de quien vende",
      "Se usa como valor inicial; puedes cambiarla para cada tienda o proveedor.",
    ),
    rowsField("rows", "Filas de movimientos", 100, 10_000, 100),
    ...ledgerDesignFields(),
  ],
});
