"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

import { FormField } from "./form-field";

const schema = z.object({ email: z.email("Escribe un correo válido") });

export function RecoverForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  if (sent) {
    return (
      <div className="text-center">
        <MailCheckIcon className="mx-auto size-10 text-brand" aria-hidden />
        <p className="mt-3 font-semibold">Revisa tu correo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.
        </p>
      </div>
    );
  }
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async ({ email }) => {
        const supabase = getBrowserSupabase();
        if (!supabase) return void toast.error(es.auth.notConfigured);
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-contrasena`,
        });
        setSent(true);
      })}
    >
      <FormField
        id="email"
        label={es.auth.email}
        type="email"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
        Enviar enlace
      </Button>
    </form>
  );
}
