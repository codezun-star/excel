"use client";

import { DownloadIcon, Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { toast } from "sonner";

import { saveConfiguration } from "@/app/actions/configs";
import { DynamicForm } from "@/components/config-form/dynamic-form";
import { useSessionUser } from "@/components/layout/user-menu";
import { WorkbookPreview } from "@/components/preview/workbook-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCountryContext, type CountryCode } from "@/countries";
import { es } from "@/i18n/es";
import { downloadBlob, downloadWorkbook } from "@/lib/excel/download";
import type { PreviewData } from "@/lib/excel/preview";
import { workbookToPreview } from "@/lib/excel/preview";
import { workbookFileName } from "@/lib/excel/filename";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { loadClientBuilder, loadTemplateForm } from "@/lib/templates-client";
import { resolveDefaultConfig, type AnyTemplateForm, type TemplateTier } from "@/templates/types";

export interface TemplateWorkspaceProps {
  slug: string;
  title: string;
  tier: TemplateTier;
  country: CountryCode;
}

type Status = "loading" | "ready" | "building" | "error";

/**
 * Espacio de trabajo de una plantilla: formulario dinámico, vista previa y
 * descarga. Las plantillas gratis se generan en el navegador; las Pro, en el
 * servidor (su código nunca se envía al navegador).
 */
export function TemplateWorkspace({ slug, title, tier, country }: TemplateWorkspaceProps) {
  const ctx = useMemo(() => requireCountryContext(country), [country]);
  const searchParams = useSearchParams();
  const configId = searchParams.get("config");
  const { user } = useSessionUser();

  const [form, setForm] = useState<AnyTemplateForm | null>(null);
  const [initial, setInitial] = useState<FieldValues | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [invalid, setInvalid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const valuesRef = useRef<FieldValues>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);

  // Carga del formulario y, si se pidió, de una configuración guardada.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadTemplateForm(slug);
        if (!loaded) throw new Error("Plantilla no disponible");
        let values = resolveDefaultConfig(loaded, ctx) as FieldValues;
        if (configId) {
          const supabase = getBrowserSupabase();
          const { data } = (await supabase
            ?.from("saved_configs")
            .select("config")
            .eq("id", configId)
            .maybeSingle()) ?? { data: null };
          if (data?.config) {
            values = { ...values, ...(data.config as FieldValues) };
            toast.success("Configuración cargada");
          }
        }
        if (cancelled) return;
        setForm(loaded);
        setInitial(values);
        valuesRef.current = values;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, ctx, configId]);

  const parse = useCallback(
    (values: FieldValues) => {
      if (!form) return null;
      const result = form.configSchema.safeParse(values);
      return result.success ? result.data : null;
    },
    [form],
  );

  const buildPreview = useCallback(
    async (values: FieldValues) => {
      const config = parse(values);
      setInvalid(!config);
      if (!config) return;
      const id = ++runId.current;
      setStatus("building");
      try {
        let data: PreviewData;
        if (tier === "free") {
          const build = await loadClientBuilder(slug);
          if (!build) throw new Error("Build no disponible");
          const wb = await build(config, ctx, { watermark: true });
          data = workbookToPreview(wb);
        } else {
          const res = await fetch(`/api/preview/${slug}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config: values, country }),
          });
          if (!res.ok) throw new Error(await res.text());
          data = (await res.json()) as PreviewData;
        }
        if (id === runId.current) setPreview(data);
      } catch (err) {
        console.error(err);
        if (id === runId.current) toast.error("No se pudo actualizar la vista previa");
      } finally {
        if (id === runId.current) setStatus("ready");
      }
    },
    [parse, tier, slug, ctx, country],
  );

  const onValuesChange = useCallback(
    (values: FieldValues) => {
      valuesRef.current = values;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void buildPreview(values), 450);
    },
    [buildPreview],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const logDownload = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase
      .from("downloads")
      .insert({ template_slug: slug, country, user_id: user?.id ?? null });
  }, [slug, country, user]);

  const download = async () => {
    const values = valuesRef.current;
    const config = parse(values);
    if (!config) {
      toast.error(es.workspace.invalid);
      return;
    }
    setDownloading(true);
    try {
      const filename = workbookFileName(slug, ctx);
      if (tier === "free") {
        const build = await loadClientBuilder(slug);
        if (!build) throw new Error("Build no disponible");
        const wb = await build(config, ctx, { watermark: true });
        await downloadWorkbook(wb, filename);
      } else {
        const res = await fetch(`/api/generate/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: values, country }),
        });
        if (!res.ok) throw new Error(await res.text());
        downloadBlob(await res.blob(), filename);
      }
      toast.success("¡Listo! Tu archivo se descargó.");
      void logDownload().catch(() => undefined);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo generar el archivo. Intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  };

  if (status === "error") {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="font-semibold">No se pudo cargar la plantilla.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Recarga la página para intentarlo de nuevo.
        </p>
      </div>
    );
  }

  if (!form || !initial) {
    return (
      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"
        aria-busy="true"
        aria-label={es.workspace.loading}
      >
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-xl font-bold">{es.workspace.configure}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const defaults = resolveDefaultConfig(form, ctx) as FieldValues;
              setInitial(defaults);
              valuesRef.current = defaults;
              setFormKey((k) => k + 1);
            }}
          >
            <RotateCcwIcon />
            {es.workspace.reset}
          </Button>
        </div>
        <DynamicForm
          key={formKey}
          form={form}
          ctx={ctx}
          initialValues={initial}
          onValuesChange={onValuesChange}
        />
      </div>

      <div className="min-w-0 lg:sticky lg:top-20">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-bold">{es.workspace.preview}</h2>
            <span
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {status === "building" && (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              )}
              {status === "building" ? es.workspace.building : invalid ? es.workspace.invalid : ""}
            </span>
          </div>
          {preview ? <WorkbookPreview data={preview} /> : <Skeleton className="h-80" />}
          <p className="mt-3 text-xs text-muted-foreground">{es.workspace.formulaHint}</p>
          <div className="mt-4 hidden gap-2 sm:flex">
            <Button
              size="lg"
              className="flex-1"
              onClick={download}
              disabled={downloading || invalid}
            >
              {downloading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
              {downloading ? es.workspace.downloading : es.workspace.download}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setSaveOpen(true)}
              disabled={invalid}
            >
              <SaveIcon />
              <span className="sr-only lg:not-sr-only">{es.workspace.save}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Barra fija en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={download} disabled={downloading || invalid}>
            {downloading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
            {downloading ? es.workspace.downloading : es.workspace.download}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setSaveOpen(true)}
            aria-label={es.workspace.save}
            disabled={invalid}
          >
            <SaveIcon />
          </Button>
        </div>
      </div>
      <div className="h-16 sm:hidden" aria-hidden />

      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        loggedIn={Boolean(user)}
        defaultName={title}
        onSave={async (name) => {
          const res = await saveConfiguration({ slug, name, country, config: valuesRef.current });
          if (res.ok) {
            toast.success("Configuración guardada en tu cuenta");
            setSaveOpen(false);
          } else toast.error(res.error);
        }}
        next={`${typeof window === "undefined" ? "" : window.location.pathname}`}
      />
    </div>
  );
}

function SaveDialog({
  open,
  onOpenChange,
  loggedIn,
  defaultName,
  onSave,
  next,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loggedIn: boolean;
  defaultName: string;
  onSave: (name: string) => Promise<void>;
  next: string;
}) {
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{es.workspace.save}</DialogTitle>
          <DialogDescription>
            {loggedIn
              ? "Guárdala en tu cuenta para volver a generarla cuando quieras."
              : "Para guardar configuraciones necesitas una cuenta gratuita."}
          </DialogDescription>
        </DialogHeader>
        {loggedIn ? (
          <div className="grid gap-2">
            <Label htmlFor="nombre-config">Nombre</Label>
            <Input
              id="nombre-config"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
        ) : null}
        <DialogFooter>
          {loggedIn ? (
            <Button
              disabled={busy || !name.trim()}
              onClick={async () => {
                setBusy(true);
                await onSave(name.trim());
                setBusy(false);
              }}
            >
              {busy && <Loader2Icon className="animate-spin" />}
              Guardar
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/registro?next=${encodeURIComponent(next)}`}>Crear cuenta</Link>
              </Button>
              <Button asChild>
                <Link href={`/login?next=${encodeURIComponent(next)}`}>Ingresar</Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
