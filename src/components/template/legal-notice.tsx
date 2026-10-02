import { AlertTriangleIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CountryContext } from "@/countries";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Aviso legal y fecha de revisión para plantillas fiscales y laborales. */
export function LegalNotice({ ctx, kind }: { ctx: CountryContext; kind: "fiscal" | "laboral" }) {
  return (
    <div className="space-y-3">
      <Alert variant="info">
        <ScaleIcon />
        <AlertTitle>
          Plantilla {kind === "fiscal" ? "fiscal" : "laboral"} — herramienta de apoyo
        </AlertTitle>
        <AlertDescription>
          <p>
            Usa las reglas de {ctx.name} versión <strong>{ctx.rulesVersion}</strong>, con última
            revisión el <strong>{formatDate(ctx.lastReviewed)}</strong>. No sustituye la asesoría de
            un contador o abogado.{" "}
            <Link
              href="/aviso-legal"
              className="font-medium text-brand-strong underline underline-offset-2"
            >
              Leer el aviso legal
            </Link>
            .
          </p>
          <p className="text-xs">
            Fuentes: {ctx.sources.map((s) => s.name.split(" — ")[0]).join(", ")}.
          </p>
        </AlertDescription>
      </Alert>
      {ctx.reviewStatus === "pending" && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>Valores pendientes de verificación oficial</AlertTitle>
          <AlertDescription>
            Las tasas y montos de esta plantilla aún no se han confirmado con las publicaciones
            oficiales. Revísalos en la hoja Parámetros antes de usarlos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
