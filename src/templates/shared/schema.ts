import { z } from "zod";

/** Fragmentos de esquema reutilizables por las plantillas. */

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color válido (#RRGGBB)");

export const text = (max = 120) => z.string().trim().max(max, `Máximo ${max} caracteres`);

export const requiredText = (max = 120, message = "Este campo es obligatorio") =>
  z.string().trim().min(1, message).max(max, `Máximo ${max} caracteres`);

/** Identificador tributario: validación general; el formato exacto lo valida la interfaz según el país. */
export const taxIdText = z
  .string()
  .trim()
  .max(25, "Máximo 25 caracteres")
  .regex(/^[0-9A-Za-z\- ]*$/, "Solo números, letras y guiones");

export const isoDate = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida");

/** Logo como data URL (PNG o JPEG) ya redimensionado en el navegador. */
export const imageDataUrl = z
  .string()
  .max(700_000, "La imagen es demasiado grande (máximo ~500 KB)")
  .regex(/^(data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+)?$/, "Formato de imagen no válido");

export const paper = z.enum(["letter", "a4"]);

export const rowsCount = (min: number, max: number) =>
  z.coerce
    .number({ error: "Escribe un número" })
    .int("Debe ser un número entero")
    .min(min, `Mínimo ${min}`)
    .max(max, `Máximo ${max}`);

export const stringList = (maxItems = 30, maxLength = 60) =>
  z
    .array(z.string().trim().min(1, "No puede quedar vacío").max(maxLength))
    .max(maxItems, `Máximo ${maxItems} elementos`);

export const money = z.coerce
  .number({ error: "Escribe un número" })
  .min(0, "No puede ser negativo");

/** Entero opcional: el campo vacío se guarda como null. */
export const optionalInt = (max = 99_999_999) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z
      .number({ error: "Escribe un número" })
      .int("Debe ser un número entero")
      .min(0)
      .max(max)
      .nullable(),
  );
