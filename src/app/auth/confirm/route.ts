import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

/** Confirma correos con token_hash (plantillas de correo de Supabase). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/cuenta";
  if (tokenHash && type) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
