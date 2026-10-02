import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/layout/legal-page";
import { activeCountries } from "@/countries";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso legal | Excel Codezun",
  description:
    "Las plantillas fiscales y laborales de Excel Codezun son herramientas de apoyo y no sustituyen la asesoría contable o legal.",
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  const countries = activeCountries();
  return (
    <LegalPage title="Aviso legal" updated="1 de octubre de 2026">
      <h2>Herramientas de apoyo, no asesoría profesional</h2>
      <p>
        Las plantillas fiscales y laborales de {SITE.name} (facturación, impuestos, planillas,
        prestaciones y similares) son
        <strong> herramientas de apoyo</strong>.{" "}
        <strong>No sustituyen la asesoría de un contador público o de un abogado</strong>, ni
        constituyen una interpretación oficial de la legislación tributaria o laboral.
      </p>
      <p>
        Antes de presentar declaraciones, pagar planillas, liquidar a un trabajador o emitir
        documentos fiscales, verifica los resultados con un profesional y con las publicaciones
        oficiales vigentes.
      </p>

      <h2>Tasas, techos y valores legales</h2>
      <p>
        Los valores legales (tasas de impuestos, techos de cotización, salarios mínimos, recargos,
        escalas de vacaciones y otros) se concentran en un módulo de reglas por país, con su
        versión, fecha de última revisión y fuentes. Cada archivo generado incluye una hoja
        «Parámetros» donde puedes revisar y ajustar esos valores.
      </p>
      <ul>
        {countries.map((c) => (
          <li key={c.code}>
            {c.name}: reglas versión <strong>{c.rulesVersion}</strong>, última revisión{" "}
            {c.lastReviewed}
            {c.reviewStatus === "pending" ? " (valores pendientes de verificación oficial)" : ""}.
            Fuentes:{" "}
            {c.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ", "}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
              </span>
            ))}
            .
          </li>
        ))}
      </ul>
      <p>
        Las normas cambian con frecuencia. Es responsabilidad de quien usa las plantillas confirmar
        que los valores estén vigentes en la fecha de uso.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        {SITE.name} no se hace responsable por multas, recargos, diferencias de pago, reclamos
        laborales ni cualquier daño derivado del uso de las plantillas o de los valores contenidos
        en ellas. El uso de los archivos es responsabilidad exclusiva del usuario.
      </p>

      <h2>Documentos fiscales</h2>
      <p>
        Los formatos de factura y notas de crédito o débito sirven como base de diseño. Para emitir
        documentos fiscales válidos debes contar con la autorización correspondiente de la
        administración tributaria (por ejemplo, el CAI y el rango autorizado en Honduras) y cumplir
        los requisitos del régimen de facturación vigente.
      </p>

      <h2>Privacidad</h2>
      <p>
        Las plantillas gratis se generan en tu navegador. Consulta la{" "}
        <Link href="/privacidad">política de privacidad</Link> para conocer qué datos se almacenan
        cuando creas una cuenta o guardas una configuración.
      </p>
    </LegalPage>
  );
}
