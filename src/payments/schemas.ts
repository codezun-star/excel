import { z } from "zod";

import { isCountryCode } from "@/countries";

import { isProviderId } from "./types";

export const checkoutItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("plan"),
    planCode: z.enum(["pro", "negocio"]),
    cycle: z.enum(["monthly", "yearly"]),
  }),
  z.object({
    kind: z.literal("template"),
    templateSlug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  }),
]);

export const couponCodeSchema = z
  .string()
  .trim()
  .max(40)
  .transform((v) => v.toUpperCase())
  .optional()
  .nullable();

export const checkoutBodySchema = z.object({
  item: checkoutItemSchema,
  provider: z.string().refine(isProviderId, "Medio de pago no válido"),
  couponCode: couponCodeSchema,
  country: z.string().refine(isCountryCode, "País no válido").default("HN"),
});

export const couponBodySchema = z.object({
  item: checkoutItemSchema,
  code: z.string().trim().min(1).max(40),
});
