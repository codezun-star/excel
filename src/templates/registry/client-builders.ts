import type { AnyTemplateBuild } from "../types";

/**
 * Builds que se ejecutan en el navegador. SOLO plantillas "free":
 * el código de las plantillas Pro nunca debe aparecer aquí (un test lo verifica).
 */
export const CLIENT_BUILDERS: Record<string, () => Promise<AnyTemplateBuild>> = {
  "factura-con-isv": () => import("../facturacion/factura-con-isv/build").then((m) => m.build),
  "cotizacion-proforma": () =>
    import("../facturacion/cotizacion-proforma/build").then((m) => m.build),
  "orden-de-compra": () => import("../facturacion/orden-de-compra/build").then((m) => m.build),
  "reporte-de-ventas": () => import("../facturacion/reporte-de-ventas/build").then((m) => m.build),
  "caja-diaria-arqueo": () =>
    import("../facturacion/caja-diaria-arqueo/build").then((m) => m.build),
  "cuentas-por-cobrar-pagar": () =>
    import("../facturacion/cuentas-por-cobrar-pagar/build").then((m) => m.build),
  "estado-de-cuenta-cliente": () =>
    import("../facturacion/estado-de-cuenta-cliente/build").then((m) => m.build),
  "recibo-de-pago": () => import("../facturacion/recibo-de-pago/build").then((m) => m.build),
  "salario-minimo": () => import("../planilla/salario-minimo/build").then((m) => m.build),
  "control-de-asistencia": () =>
    import("../planilla/control-de-asistencia/build").then((m) => m.build),
  "horarios-y-turnos": () => import("../planilla/horarios-y-turnos/build").then((m) => m.build),
};
