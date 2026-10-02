import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad | Excel Codezun",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updated="1 de octubre de 2026">
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Plantillas gratis:</strong> se generan en tu navegador. Los datos que escribes en
          el formulario (nombre del negocio, RTN, logo, etc.) no se envían a nuestros servidores.
        </li>
        <li>
          <strong>Plantillas Pro:</strong> se generan en nuestro servidor con la configuración que
          envías; no la almacenamos salvo que la guardes.
        </li>
        <li>
          <strong>Cuenta:</strong> correo, nombre, país, plan y, si las guardas, tus configuraciones
          de plantillas.
        </li>
        <li>
          <strong>Uso:</strong> registramos qué plantilla se descargó, el país y la fecha para
          estadísticas y límites de uso.
        </li>
        <li>
          <strong>Pagos:</strong> los procesan proveedores externos; nunca almacenamos datos de
          tarjetas. Para transferencias guardamos el comprobante que subes.
        </li>
      </ul>
      <h2>Para qué los usamos</h2>
      <p>
        Para prestar el servicio, administrar tu cuenta y tu plan, prevenir abusos y mejorar las
        plantillas.
      </p>
      <h2>Con quién los compartimos</h2>
      <p>
        Con proveedores de infraestructura (base de datos y autenticación), de pagos y de correo,
        únicamente para prestar el servicio.
      </p>
      <h2>Cookies</h2>
      <p>
        Usamos cookies técnicas para mantener tu sesión y para controlar los límites de descarga. No
        usamos cookies publicitarias.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes acceder, corregir o eliminar tus datos escribiendo a {SITE.contactEmail}. También
        puedes borrar tus configuraciones desde tu cuenta.
      </p>
    </LegalPage>
  );
}
