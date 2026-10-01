/**
 * Excel limita los nombres de hoja a 31 caracteres, sin : \ / ? * [ ]
 * y sin comillas simples al inicio o al final. Además deben ser únicos
 * (sin distinguir mayúsculas).
 */
const INVALID = /[:\\/?*[\]]/g;
const MAX_LENGTH = 31;
const RESERVED = new Set(["history"]);

export function safeSheetName(name: string, existing: Iterable<string> = []): string {
  let base = name.replace(INVALID, " ").replace(/\s+/g, " ").trim();
  base = base.replace(/^'+|'+$/g, "").trim();
  if (!base || RESERVED.has(base.toLowerCase())) base = "Hoja";
  base = base.slice(0, MAX_LENGTH).trim();

  const taken = new Set(Array.from(existing, (n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;

  for (let i = 2; i < 1000; i++) {
    const suffix = ` (${i})`;
    const candidate = `${base.slice(0, MAX_LENGTH - suffix.length).trim()}${suffix}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  throw new Error(`No se pudo generar un nombre de hoja único para "${name}"`);
}
