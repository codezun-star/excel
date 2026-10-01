import "server-only";

import type { AnyTemplateDefinition } from "../types";

/** Definiciones completas para generar archivos en el servidor (plantillas Pro y lotes). */
export const SERVER_TEMPLATES: Record<string, () => Promise<AnyTemplateDefinition>> = {
  "factura-con-isv": () => import("../facturacion/factura-con-isv").then((m) => m.default),
  "cotizacion-proforma": () => import("../facturacion/cotizacion-proforma").then((m) => m.default),
  "orden-de-compra": () => import("../facturacion/orden-de-compra").then((m) => m.default),
  "nota-de-credito-debito": () =>
    import("../facturacion/nota-de-credito-debito").then((m) => m.default),
  "reporte-de-ventas": () => import("../facturacion/reporte-de-ventas").then((m) => m.default),
  "caja-diaria-arqueo": () => import("../facturacion/caja-diaria-arqueo").then((m) => m.default),
  "cuentas-por-cobrar-pagar": () =>
    import("../facturacion/cuentas-por-cobrar-pagar").then((m) => m.default),
  "estado-de-cuenta-cliente": () =>
    import("../facturacion/estado-de-cuenta-cliente").then((m) => m.default),
  "recibo-de-pago": () => import("../facturacion/recibo-de-pago").then((m) => m.default),
  "libro-de-ventas-y-compras": () =>
    import("../facturacion/libro-de-ventas-y-compras").then((m) => m.default),
  "ventas-por-vendedor-comisiones": () =>
    import("../facturacion/ventas-por-vendedor-comisiones").then((m) => m.default),
  "planilla-de-sueldos": () => import("../planilla/planilla-de-sueldos").then((m) => m.default),
  "decimo-tercer-y-cuarto-mes": () =>
    import("../planilla/decimo-tercer-y-cuarto-mes").then((m) => m.default),
  "prestaciones-laborales": () =>
    import("../planilla/prestaciones-laborales").then((m) => m.default),
  "horas-extra": () => import("../planilla/horas-extra").then((m) => m.default),
  "salario-minimo": () => import("../planilla/salario-minimo").then((m) => m.default),
  "control-de-vacaciones": () => import("../planilla/control-de-vacaciones").then((m) => m.default),
  "control-de-asistencia": () => import("../planilla/control-de-asistencia").then((m) => m.default),
  "horarios-y-turnos": () => import("../planilla/horarios-y-turnos").then((m) => m.default),
  "boleta-de-pago": () => import("../planilla/boleta-de-pago").then((m) => m.default),
};

export async function loadServerTemplate(slug: string): Promise<AnyTemplateDefinition | null> {
  const loader = SERVER_TEMPLATES[slug];
  return loader ? loader() : null;
}
