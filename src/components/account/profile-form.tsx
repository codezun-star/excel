"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateProfile } from "@/app/cuenta/actions";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/countries";

const schema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre").max(80),
  country: z.string(),
});

export function ProfileForm({
  fullName,
  country,
  email,
}: {
  fullName: string;
  country: string;
  email: string;
}) {
  const { register, handleSubmit, formState, control } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName, country },
  });
  return (
    <form
      noValidate
      className="max-w-md space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const res = await updateProfile(values);
        if (res.ok) toast.success("Perfil actualizado");
        else toast.error(res.error);
      })}
    >
      <FormField id="perfil-email" label="Correo" value={email} disabled readOnly />
      <FormField
        id="perfil-nombre"
        label="Nombre completo"
        error={formState.errors.fullName?.message}
        {...register("fullName")}
      />
      <Controller
        control={control}
        name="country"
        render={({ field }) => (
          <div className="grid gap-1.5">
            <Label htmlFor="perfil-pais">País</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="perfil-pais">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} disabled={c.status !== "active"}>
                    {c.name}
                    {c.status !== "active" ? " (próximamente)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2Icon className="animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
