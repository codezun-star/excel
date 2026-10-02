"use client";

import { FileSpreadsheetIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteConfiguration, refreshConfigRules } from "@/app/actions/configs";
import { Button } from "@/components/ui/button";

export interface SavedConfigItem {
  id: string;
  name: string;
  templateTitle: string;
  href: string;
  updatedAt: string;
  /** Se guardó con una versión de reglas anterior a la vigente */
  outdated?: boolean;
  rulesVersion?: string | null;
  currentRulesVersion?: string;
}

export function SavedConfigs({
  items,
  canUpdateRules = false,
}: {
  items: SavedConfigItem[];
  /** Beneficio Pro: regenerar con las tasas nuevas en un clic */
  canUpdateRules?: boolean;
}) {
  const router = useRouter();
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
              {item.outdated && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm font-medium text-highlight-strong">
                  <RefreshCwIcon className="size-3.5" aria-hidden />
                  Hay una versión más reciente de tu plantilla
                  {item.currentRulesVersion ? ` (reglas ${item.currentRulesVersion})` : ""}.
                  {canUpdateRules ? (
                    <button
                      type="button"
                      className="underline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const res = await refreshConfigRules(item.id);
                          if (res.ok) router.push(`${item.href}?config=${item.id}`);
                          else toast.error(res.error);
                        })
                      }
                    >
                      Regenerar con las tasas nuevas
                    </button>
                  ) : (
                    <Link href="/precios" className="underline">
                      Con Pro la regeneras en un clic
                    </Link>
                  )}
                </p>
              )}
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
