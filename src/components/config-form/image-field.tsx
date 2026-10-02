"use client";

import { ImageUpIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;

/** Redimensiona una imagen en el navegador y la devuelve como data URL (PNG o JPEG). */
async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = url;
    });
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no permite procesar imágenes");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return file.type === "image/png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageField({
  value,
  onChange,
  maxWidth = 480,
  maxHeight = 240,
  disabled,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  disabled?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Vista previa del logo"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImageUpIcon className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild disabled={disabled}>
            <label htmlFor={id} className="cursor-pointer">
              {value ? "Cambiar" : "Subir imagen"}
            </label>
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled}
            >
              <Trash2Icon />
              Quitar
            </Button>
          )}
        </div>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError(null);
            if (!["image/png", "image/jpeg"].includes(file.type))
              return setError("Usa una imagen PNG o JPG.");
            if (file.size > MAX_INPUT_BYTES) return setError("La imagen supera 5 MB.");
            try {
              onChange(await resizeImage(file, maxWidth, maxHeight));
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
            }
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
