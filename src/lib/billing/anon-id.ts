import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Identificador de visitante anónimo en una cookie FIRMADA (HMAC-SHA256),
 * para aplicar el límite de descargas sin cuenta. Si alguien borra la cookie
 * obtiene una nueva (límite "blando"), pero no puede falsificar la de otro
 * ni inventar ids sin la firma.
 */
export const ANON_COOKIE = "ec_anon";
export const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 meses

const DEV_SECRET = "solo-desarrollo-cambia-ANON_ID_SECRET";

export function anonSecret(): string {
  const secret = process.env.ANON_ID_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production")
    console.warn("[anon-id] Falta ANON_ID_SECRET: usando un secreto de desarrollo");
  return DEV_SECRET;
}

function signature(id: string, secret: string): string {
  return createHmac("sha256", secret).update(`anon:${id}`).digest("base64url").slice(0, 32);
}

export function newAnonId(): string {
  return `a_${randomBytes(16).toString("base64url")}`;
}

export function signAnonId(id: string, secret = anonSecret()): string {
  return `${id}.${signature(id, secret)}`;
}

/** Devuelve el id si la firma es válida, o null. */
export function verifyAnonCookie(
  value: string | undefined | null,
  secret = anonSecret(),
): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  if (!/^a_[A-Za-z0-9_-]{16,40}$/.test(id)) return null;
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(signature(id, secret));
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

export function anonCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANON_COOKIE_MAX_AGE,
  };
}
