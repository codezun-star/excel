/**
 * Variables públicas de Supabase. Si faltan, el sitio sigue funcionando
 * (generar y descargar plantillas) y se desactivan las funciones de cuenta.
 */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}
