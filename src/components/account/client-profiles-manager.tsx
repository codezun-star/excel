"use client";

import { Building2Icon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClientProfile, saveClientProfile } from "@/app/actions/client-profiles";
import { ColorField } from "@/components/config-form/color-field";
import { ImageField } from "@/components/config-form/image-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientProfile } from "@/lib/billing/client-profile";
import { COLOR_PRESETS } from "@/templates/shared/fields";

type Draft = {
  id?: string;
  name: string;
  rtn: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  color: string;
  footer: string;
};

const EMPTY: Draft = {
  name: "",
  rtn: "",
  address: "",
  phone: "",
  email: "",
  logo: "",
  color: "#217346",
  footer: "",
};

function toDraft(p: ClientProfile): Draft {
  return {
    id: p.id,
    name: p.name,
    rtn: p.rtn ?? "",
    address: p.address ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    logo: p.logo ?? "",
    color: p.branding?.color ?? "#217346",
    footer: p.branding?.footer ?? "",
  };
}

export function ClientProfilesManager({
  profiles,
  max,
  batch,
}: {
  profiles: ClientProfile[];
  max: number;
  batch: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, start] = useTransition();
  const full = profiles.length >= max;

  const set = (k: keyof Draft) => (v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveClientProfile(draft);
      if (res.ok) {
        toast.success("Perfil guardado");
        setDraft(null);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {profiles.length} de {max} perfiles.{" "}
          {batch
            ? "Elige un perfil en cualquier plantilla o descarga para varios a la vez."
            : "Elige tu perfil en cualquier plantilla para llenar tus datos."}
        </p>
        <Button onClick={() => setDraft({ ...EMPTY })} disabled={full}>
          <PlusIcon />
          Nuevo perfil
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Crea tu primer perfil con el nombre, RTN y logo de tu negocio o de tu cliente.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt="" className="size-12 rounded-md border object-contain" />
              ) : (
                <div
                  className="flex size-12 items-center justify-center rounded-md text-white"
                  style={{ background: p.branding?.color ?? "#217346" }}
                >
                  <Building2Icon className="size-5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[p.rtn && `RTN ${p.rtn}`, p.phone].filter(Boolean).join(" · ") ||
                    "Sin datos adicionales"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Editar ${p.name}`}
                  onClick={() => setDraft(toDraft(p))}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Eliminar ${p.name}`}
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar el perfil «${p.name}»?`)) return;
                    start(async () => {
                      const res = await deleteClientProfile(p.id);
                      if (res.ok) router.refresh();
                      else toast.error(res.error);
                    });
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar perfil" : "Nuevo perfil"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Nombre o razón social", 120],
                  ["rtn", "RTN", 25],
                  ["phone", "Teléfono", 40],
                  ["email", "Correo", 120],
                ] as const
              ).map(([k, label, max]) => (
                <div key={k} className="grid gap-1.5">
                  <Label htmlFor={`perfil-${k}`}>{label}</Label>
                  <Input
                    id={`perfil-${k}`}
                    value={draft[k]}
                    maxLength={max}
                    onChange={(e) => set(k)(e.target.value)}
                  />
                </div>
              ))}
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="perfil-address">Dirección</Label>
                <Input
                  id="perfil-address"
                  value={draft.address}
                  maxLength={200}
                  onChange={(e) => set("address")(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Logo</Label>
                <ImageField
                  value={draft.logo}
                  onChange={set("logo")}
                  maxWidth={480}
                  maxHeight={240}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-color">Color</Label>
                <ColorField
                  id="perfil-color"
                  value={draft.color}
                  onChange={set("color")}
                  presets={COLOR_PRESETS}
                />
              </div>
              {batch && (
                <div className="grid gap-1.5">
                  <Label htmlFor="perfil-footer">Pie de página (tu marca)</Label>
                  <Input
                    id="perfil-footer"
                    value={draft.footer}
                    maxLength={120}
                    placeholder="Preparado por Contadores Asociados"
                    onChange={(e) => set("footer")(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={pending || !draft?.name.trim()}>
              {pending && <Loader2Icon className="animate-spin" />}
              Guardar perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
