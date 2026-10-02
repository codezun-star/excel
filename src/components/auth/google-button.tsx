"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

export function GoogleButton({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        const supabase = getBrowserSupabase();
        if (!supabase) return toast.error(es.auth.notConfigured);
        setBusy(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) {
          setBusy(false);
          toast.error("No se pudo iniciar sesión con Google");
        }
      }}
    >
      <GoogleIcon />
      {es.auth.google}
    </Button>
  );
}
