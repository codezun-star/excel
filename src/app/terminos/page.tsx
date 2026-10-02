import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/layout/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos del servicio | Excel Codezun",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos del servicio" updated="1 de octubre de 2026">
      <h2>1. Aceptación</h2>
      <p>
        Al usar {SITE.name} ({SITE.domain}) aceptas estos términos. Si no estás de acuerdo, no uses
        el servicio.
      </p>
      <h2>2. El servicio</h2>
      <p>
        {SITE.name} permite configurar y descargar plantillas de hojas de cálculo. Algunas
        plantillas y funciones son gratuitas y otras requieren un plan de pago o una compra única,
        según se indique en la página de <Link href="/precios">precios</Link>.
      </p>
      <h2>3. Cuentas</h2>
      <p>
        Eres responsable de la confidencialidad de tu contraseña y de la actividad de tu cuenta.
        Debes proporcionar información veraz.
      </p>
      <h2>4. Licencia de uso</h2>
      <p>
        Los archivos que descargas pueden usarse en tu negocio o vida personal y modificarse
        libremente. No está permitido revender, redistribuir o publicar las plantillas como propias
        ni ofrecerlas como un servicio de terceros.
      </p>
      <h2>5. Pagos</h2>
      <p>
        Los precios se muestran en dólares estadounidenses con una referencia en moneda local. Los
        planes de suscripción se renuevan según el ciclo elegido hasta que los canceles. Consulta la{" "}
        <Link href="/reembolsos">política de reembolsos</Link>.
      </p>
      <h2>6. Contenido fiscal y laboral</h2>
      <p>
        Las plantillas fiscales y laborales son herramientas de apoyo. Consulta el{" "}
        <Link href="/aviso-legal">aviso legal</Link>.
      </p>
      <h2>7. Limitación de responsabilidad</h2>
      <p>
        El servicio se ofrece «tal cual». En la medida permitida por la ley, no respondemos por
        daños indirectos derivados de su uso.
      </p>
      <h2>8. Cambios</h2>
      <p>
        Podemos actualizar estos términos; publicaremos la fecha de la última actualización en esta
        página.
      </p>
      <h2>9. Contacto</h2>
      <p>Escríbenos a {SITE.contactEmail}.</p>
    </LegalPage>
  );
}
