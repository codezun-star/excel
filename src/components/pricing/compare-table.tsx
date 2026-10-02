import { CheckIcon, MinusIcon } from "lucide-react";

import type { PlanDefinition, PlanLimits } from "@/config/plans";

type Row = { label: string; value: (l: PlanLimits) => string | boolean };

const ROWS: Row[] = [
  { label: "Plantillas gratis", value: () => true },
  { label: "Plantillas Pro (planilla, ISV, ISR, prestaciones…)", value: (l) => l.proTemplates },
  {
    label: "Descargas al mes",
    value: (l) =>
      l.downloadsPerMonth === null
        ? "Sin límite"
        : l.downloadsPerMonth >= 300
          ? "Sin límite razonable"
          : `${l.downloadsPerMonth} (${l.anonDownloadsPerMonth} sin cuenta)`,
  },
  { label: "Guardar configuraciones", value: (l) => l.saveConfigs },
  { label: "Tu logo en los documentos", value: (l) => l.customLogo },
  { label: "Sin marca de agua", value: (l) => !l.watermark },
  { label: "Aviso y regeneración cuando cambian las tasas", value: (l) => l.rateUpdates },
  {
    label: "Perfiles de cliente o empresa",
    value: (l) =>
      l.clientProfiles > 1 ? `Hasta ${l.clientProfiles}` : l.clientProfiles === 1 ? "1" : false,
  },
  { label: "Tu marca en lugar de la nuestra", value: (l) => l.whiteLabel },
  { label: "Descarga por lote", value: (l) => l.batchDownload },
];

/** Tabla comparativa de planes generada a partir de los límites. */
export function CompareTable({ plans }: { plans: PlanDefinition[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">Comparación de planes</caption>
        <thead>
          <tr className="border-b bg-muted/50">
            <th scope="col" className="p-3 text-left font-semibold">
              Incluye
            </th>
            {plans.map((p) => (
              <th key={p.code} scope="col" className="p-3 text-center font-heading font-bold">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b last:border-0">
              <th scope="row" className="p-3 text-left font-normal">
                {row.label}
              </th>
              {plans.map((p) => {
                const v = row.value(p.limits);
                return (
                  <td key={p.code} className="p-3 text-center">
                    {v === true ? (
                      <CheckIcon className="mx-auto size-4 text-brand" aria-label="Sí" />
                    ) : v === false ? (
                      <MinusIcon className="mx-auto size-4 text-muted-foreground" aria-label="No" />
                    ) : (
                      <span className="font-medium">{v}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
