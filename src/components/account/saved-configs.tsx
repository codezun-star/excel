"use client";

import { FileSpreadsheetIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteConfiguration } from "@/app/actions/configs";
import { Button } from "@/components/ui/button";

export interface SavedConfigItem {
  id: string;
  name: string;
  templateTitle: string;
  href: string;
  updatedAt: string;
  outdated?: boolean;
}

export function SavedConfigs({ items }: { items: SavedConfigItem[] }) {
  const [pending, start] = useTransition();
  if (!items.length) {
    return (
      <EmptyState text="Aún no guardas configuraciones. Configura una plantilla y presiona «Guardar configuración»." />
    );
  }
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <FileSpreadsheetIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.templateTitle} · {new Date(item.updatedAt).toLocaleDateString("es-HN")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`${item.href}?config=${item.id}`}>Usar</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              aria-label={`Eliminar ${item.name}`}
              onClick={() =>
                start(async () => {
                  const res = await deleteConfiguration(item.id);
                  if (res.ok) toast.success("Configuración eliminada");
                  else toast.error(res.error);
                })
              }
            >
              <Trash2Icon />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
