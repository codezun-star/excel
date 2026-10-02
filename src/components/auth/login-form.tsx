"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

import { FormField } from "./form-field";
import { GoogleButton } from "./google-button";
import { useNextPath } from "./use-next-path";

const schema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export function LoginForm() {
  const router = useRouter();
  const next = useNextPath();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

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
          const { error } = await supabase.auth.signInWithPassword(values);
          if (error) {
            toast.error(
              error.message.includes("confirm")
                ? "Confirma tu correo antes de ingresar."
                : "Correo o contraseña incorrectos.",
            );
            return;
          }
          router.push(next);
          router.refresh();
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
        <FormField
          id="password"
          label={es.auth.password}
          type="password"
          autoComplete="current-password"
          error={formState.errors.password?.message}
          {...register("password")}
        />
        <div className="text-right text-sm">
          <Link href="/recuperar" className="font-medium text-brand-strong hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
          Ingresar
        </Button>
      </form>
    </div>
  );
}
