"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

import { FormField } from "./form-field";
import { GoogleButton } from "./google-button";
import { useNextPath } from "./use-next-path";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Escribe tu nombre").max(80),
    email: z.email("Escribe un correo válido"),
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
    confirm: z.string(),
    terms: z.boolean().refine((v) => v, "Debes aceptar los términos"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });

export function SignupForm() {
  const next = useNextPath();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState, control } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  });

  if (sentTo) {
    return (
      <div className="text-center">
        <MailCheckIcon className="mx-auto size-10 text-brand" aria-hidden />
        <p className="mt-3 font-semibold">Revisa tu correo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos un enlace de confirmación a {sentTo}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o con tu correo</span>
        <Separator className="flex-1" />
      </div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const supabase = getBrowserSupabase();
          if (!supabase) return void toast.error(es.auth.notConfigured);
          const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: { full_name: values.fullName, country: "HN" },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
          if (error) return void toast.error("No se pudo crear la cuenta. ¿Ya estás registrado?");
          setSentTo(values.email);
        })}
      >
        <FormField
          id="fullName"
          label={es.auth.name}
          autoComplete="name"
          error={formState.errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          id="email"
          label={es.auth.email}
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register("email")}
        />
        <FormField
          id="password"
          label={es.auth.password}
          type="password"
          autoComplete="new-password"
          error={formState.errors.password?.message}
          {...register("password")}
        />
        <FormField
          id="confirm"
          label="Confirma tu contraseña"
          type="password"
          autoComplete="new-password"
          error={formState.errors.confirm?.message}
          {...register("confirm")}
        />
        <Controller
          control={control}
          name="terms"
          render={({ field }) => (
            <div className="grid gap-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="leading-snug font-normal text-muted-foreground">
                  Acepto los{" "}
                  <Link href="/terminos" className="text-brand-strong underline">
                    términos del servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="text-brand-strong underline">
                    política de privacidad
                  </Link>
                  .
                </Label>
              </div>
              {formState.errors.terms && (
                <p className="text-xs font-medium text-destructive">
                  {formState.errors.terms.message}
                </p>
              )}
            </div>
          )}
        />
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
          Crear cuenta gratis
        </Button>
      </form>
    </div>
  );
}
