import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de reembolsos | Excel Codezun",
  alternates: { canonical: "/reembolsos" },
};

export default function RefundsPage() {
  return (
    <LegalPage title="Política de reembolsos" updated="1 de octubre de 2026">
      <h2>Garantía de satisfacción</h2>
      <p>
        Si el plan Pro no te sirve, escríbenos dentro de los primeros 7 días después del primer pago
        y te devolvemos el dinero.
      </p>
      <h2>Compras únicas</h2>
      <p>
        Si una plantilla comprada no funciona como se describe y no podemos resolverlo, reembolsamos
        la compra dentro de los 7 días.
      </p>
      <h2>Cancelaciones</h2>
      <p>
        Puedes cancelar tu suscripción en cualquier momento desde tu cuenta; seguirás teniendo
        acceso hasta el final del período pagado.
      </p>
      <h2>Cómo solicitarlo</h2>
      <p>Escribe a {SITE.contactEmail} con el correo de tu cuenta y la referencia del pago.</p>
    </LegalPage>
  );
}
