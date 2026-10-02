import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

/** Rutas que requieren sesión (comprobación optimista; cada página vuelve a verificar). */
const PROTECTED = ["/cuenta", "/admin"];

/** Refresca la sesión de Supabase en cada solicitud y protege rutas privadas. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const env = supabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Importante: no ejecutar código entre createServerClient y getClaims.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!isAuthenticated && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
