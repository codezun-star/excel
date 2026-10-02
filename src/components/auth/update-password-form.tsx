"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";
import { getBrowserSupabase } from "@/lib/supabase/client";

import { FormField } from "./form-field";

const schema = z
  .object({ password: z.string().min(8, "Mínimo 8 caracteres").max(72), confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });

export function UpdatePasswordForm() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async ({ password }) => {
        const supabase = getBrowserSupabase();
        if (!supabase) return void toast.error(es.auth.notConfigured);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return void toast.error("El enlace venció. Solicita uno nuevo.");
        toast.success("Contraseña actualizada");
        router.push("/cuenta");
        router.refresh();
      })}
    >
      <FormField
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <FormField
        id="confirm"
        label="Confirma la contraseña"
        type="password"
        autoComplete="new-password"
        error={formState.errors.confirm?.message}
        {...register("confirm")}
      />
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
        Guardar contraseña
      </Button>
    </form>
  );
}
