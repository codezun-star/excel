"use client";

import { Building2Icon, Layers3Icon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_PROFILE_COLUMNS, type ClientProfile } from "@/lib/billing/client-profile";
import { downloadBlob } from "@/lib/excel/download";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Perfiles de cliente del usuario (RLS: solo los propios). */
export function useClientProfiles(enabled: boolean): ClientProfile[] {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    void supabase
      .from("client_profiles")
      .select(CLIENT_PROFILE_COLUMNS)
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data) setProfiles(data as ClientProfile[]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return profiles;
}

export function ClientProfileSelect({
  profiles,
  value,
  onChange,
}: {
  profiles: ClientProfile[];
  value: string | null;
  onChange: (profile: ClientProfile | null) => void;
}) {
  return (
    <div className="mb-4 grid gap-1.5 rounded-xl border bg-card p-4">
      <Label htmlFor="perfil-cliente" className="flex items-center gap-2">
        <Building2Icon className="size-4" aria-hidden />
        Llenar con un perfil
      </Label>
      {profiles.length ? (
        <Select
          value={value ?? "ninguno"}
          onValueChange={(v) => onChange(profiles.find((p) => p.id === v) ?? null)}
        >
          <SelectTrigger id="perfil-cliente">
            <SelectValue placeholder="Elige un perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguno">Sin perfil</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aún no tienes perfiles.{" "}
          <Link href="/cuenta/clientes" className="font-medium text-brand-strong underline">
            Crear uno
          </Link>
        </p>
      )}
    </div>
  );
}

/** Descarga por lote: misma configuración para varios perfiles, en un .zip. */
export function BatchDownloadDialog({
  open,
  onOpenChange,
  profiles,
  slug,
  country,
  getConfig,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: ClientProfile[];
  slug: string;
  country: string;
  getConfig: () => unknown;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/batch/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: getConfig(), country, clientProfileIds: selected }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "No se pudo generar el lote");
        return;
      }
      downloadBlob(await res.blob(), `${slug}-lote.zip`);
      toast.success(`Listo: ${selected.length} archivos en un .zip`);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers3Icon className="size-5" aria-hidden /> Descargar para varios clientes
          </DialogTitle>
          <DialogDescription>
            Se usa la configuración actual y se reemplazan nombre, RTN, logo y datos con los de cada
            perfil. Cada archivo cuenta como una descarga.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-72 gap-2 overflow-y-auto">
          {profiles.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelected((s) => (v ? [...s, p.id] : s.filter((x) => x !== p.id)))
                  }
                />
                {p.name}
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              setSelected(selected.length === profiles.length ? [] : profiles.map((p) => p.id))
            }
          >
            {selected.length === profiles.length ? "Quitar todos" : "Elegir todos"}
          </Button>
          <Button onClick={run} disabled={busy || selected.length === 0}>
            {busy && <Loader2Icon className="animate-spin" />}
            Descargar {selected.length || ""} archivos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
