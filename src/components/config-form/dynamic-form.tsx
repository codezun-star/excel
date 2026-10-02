"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type FieldValues, type Resolver } from "react-hook-form";

import { ProLock } from "@/components/catalog/tier-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CountryContext } from "@/countries";
import { cn } from "@/lib/utils";
import { resolveOptions, type AnyTemplateForm, type FormFieldDef } from "@/templates/types";

import { ColorField } from "./color-field";
import { ImageField } from "./image-field";
import { ListField } from "./list-field";

export interface DynamicFormProps {
  form: AnyTemplateForm;
  ctx: CountryContext;
  initialValues: FieldValues;
  onValuesChange: (values: FieldValues) => void;
  /** Bloquea los campos marcados como proOnly (planes sin acceso Pro) */
  proLocked?: boolean;
  disabled?: boolean;
}

const fieldId = (name: string) => `campo-${name}`;

function groupBySection(fields: FormFieldDef[]): { title: string; fields: FormFieldDef[] }[] {
  const groups: { title: string; fields: FormFieldDef[] }[] = [];
  for (const f of fields) {
    const title = f.section ?? "Opciones";
    let group = groups.find((g) => g.title === title);
    if (!group) {
      group = { title, fields: [] };
      groups.push(group);
    }
    group.fields.push(f);
  }
  return groups;
}

/**
 * Formulario de configuración generado a partir de `formFields`. Valida con
 * el esquema Zod de la plantilla y avisa de cada cambio al componente padre.
 */
export function DynamicForm({
  form,
  ctx,
  initialValues,
  onValuesChange,
  proLocked,
  disabled,
}: DynamicFormProps) {
  const methods = useForm<FieldValues>({
    resolver: zodResolver(form.configSchema as never) as unknown as Resolver<FieldValues>,
    defaultValues: initialValues,
    mode: "onChange",
  });
  const { control, register, formState } = methods;
  const values = useWatch({ control });

  useEffect(() => {
    onValuesChange(values);
  }, [values, onValuesChange]);

  // Valida desde el inicio para mostrar errores en valores precargados.
  useEffect(() => {
    void methods.trigger();
  }, [methods]);

  const groups = useMemo(() => groupBySection(form.formFields), [form.formFields]);

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {groups.map((group) => (
        <fieldset
          key={group.title}
          className="rounded-xl border bg-card p-4 sm:p-5"
          disabled={disabled}
        >
          <legend className="-ml-1 px-1 font-heading text-base font-bold">{group.title}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              if (field.showWhen) {
                const current = values[field.showWhen.field];
                if (String(current) !== String(field.showWhen.equals)) return null;
              }
              const locked = Boolean(field.proOnly && proLocked);
              const error = formState.errors[field.name]?.message as string | undefined;
              const id = fieldId(field.name);
              const descId = `${id}-desc`;
              const errId = `${id}-error`;
              const describedBy =
                [
                  field.description || (field.type === "text" && field.taxId) ? descId : null,
                  error ? errId : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined;
              const label = field.type === "text" && field.taxId ? ctx.taxId.name : field.label;
              const description =
                field.type === "text" && field.taxId
                  ? (field.description ?? ctx.taxId.description)
                  : field.description;
              const wide =
                field.fullWidth ||
                ["list", "multiselect", "image", "textarea"].includes(field.type);

              return (
                <div
                  key={field.name}
                  className={cn("grid content-start gap-1.5", wide && "sm:col-span-2")}
                >
                  {field.type === "switch" ? (
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: f }) => (
                        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                          <div className="grid gap-1">
                            <Label htmlFor={id} className="flex items-center gap-2">
                              {label}
                              {field.proOnly && <ProLock />}
                            </Label>
                            {description && (
                              <p
                                id={descId}
                                className="text-xs leading-relaxed text-muted-foreground"
                              >
                                {description}
                              </p>
                            )}
                          </div>
                          <Switch
                            id={id}
                            checked={Boolean(f.value)}
                            onCheckedChange={f.onChange}
                            disabled={disabled || locked}
                            aria-describedby={describedBy}
                          />
                        </div>
                      )}
                    />
                  ) : (
                    <>
                      <Label htmlFor={id} className="flex items-center gap-2">
                        {label}
                        {field.required && (
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        )}
                        {field.proOnly && <ProLock />}
                      </Label>
                      <FieldControl
                        field={field}
                        id={id}
                        describedBy={describedBy}
                        invalid={Boolean(error)}
                        disabled={disabled || locked}
                        control={control}
                        register={register}
                        ctx={ctx}
                      />
                      {description && (
                        <p id={descId} className="text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      )}
                      {field.type === "text" && field.taxId && (
                        <TaxIdHint value={String(values[field.name] ?? "")} ctx={ctx} />
                      )}
                      {locked && (
                        <p className="text-xs font-medium text-highlight-strong">
                          Disponible en el plan Pro.
                        </p>
                      )}
                    </>
                  )}
                  {error && (
                    <p id={errId} role="alert" className="text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </form>
  );
}

function TaxIdHint({ value, ctx }: { value: string; ctx: CountryContext }) {
  if (!value) return null;
  const ok = new RegExp(ctx.taxId.pattern).test(value.trim());
  if (ok) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-highlight-strong">
      <AlertTriangleIcon className="size-3.5" aria-hidden />
      Formato esperado: {ctx.taxId.placeholder}
    </p>
  );
}

function FieldControl({
  field,
  id,
  describedBy,
  invalid,
  disabled,
  control,
  register,
  ctx,
}: {
  field: FormFieldDef;
  id: string;
  describedBy?: string;
  invalid: boolean;
  disabled?: boolean;
  control: ReturnType<typeof useForm<FieldValues>>["control"];
  register: ReturnType<typeof useForm<FieldValues>>["register"];
  ctx: CountryContext;
}) {
  const aria = { "aria-describedby": describedBy, "aria-invalid": invalid || undefined };
  switch (field.type) {
    case "text":
      return (
        <Input
          id={id}
          {...register(field.name)}
          {...aria}
          placeholder={field.taxId ? ctx.taxId.placeholder : field.placeholder}
          maxLength={field.maxLength}
          inputMode={field.inputMode}
          disabled={disabled}
          autoComplete="off"
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          {...register(field.name)}
          {...aria}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
          maxLength={field.maxLength}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <div className="relative">
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            {...register(field.name)}
            {...aria}
            min={field.min}
            max={field.max}
            step={field.step ?? "any"}
            disabled={disabled}
            className={cn("tabular-nums", field.suffix && "pr-10")}
          />
          {field.suffix && (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              {field.suffix}
            </span>
          )}
        </div>
      );
    case "date":
      return <Input id={id} type="date" {...register(field.name)} {...aria} disabled={disabled} />;
    case "select":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <Select
              value={f.value === undefined || f.value === null ? "" : String(f.value)}
              onValueChange={f.onChange}
              disabled={disabled}
            >
              <SelectTrigger id={id} {...aria}>
                <SelectValue placeholder="Elige una opción" />
              </SelectTrigger>
              <SelectContent>
                {resolveOptions(field.options, ctx).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      );
    case "multiselect":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => {
            const selected: string[] = Array.isArray(f.value) ? f.value : [];
            return (
              <div id={id} role="group" {...aria} className="grid gap-2 sm:grid-cols-2">
                {resolveOptions(field.options, ctx).map((o) => {
                  const checked = selected.includes(o.value);
                  const optId = `${id}-${o.value}`;
                  return (
                    <label
                      key={o.value}
                      htmlFor={optId}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        id={optId}
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(v) =>
                          f.onChange(
                            v ? [...selected, o.value] : selected.filter((x) => x !== o.value),
                          )
                        }
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            );
          }}
        />
      );
    case "color":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <ColorField
              id={id}
              value={String(f.value ?? "")}
              onChange={f.onChange}
              presets={field.presets}
              disabled={disabled}
            />
          )}
        />
      );
    case "list":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <ListField
              id={id}
              value={f.value as string[]}
              onChange={f.onChange}
              placeholder={field.itemPlaceholder}
              maxItems={field.maxItems}
              addLabel={field.addLabel}
              disabled={disabled}
            />
          )}
        />
      );
    case "image":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <ImageField
              value={String(f.value ?? "")}
              onChange={f.onChange}
              maxWidth={field.maxWidth}
              maxHeight={field.maxHeight}
              disabled={disabled}
              describedBy={describedBy}
            />
          )}
        />
      );
    case "switch":
      return null;
  }
}
