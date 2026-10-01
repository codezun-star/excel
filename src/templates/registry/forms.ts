import type { AnyTemplateForm } from "../types";

/**
 * Cargadores de formularios (esquema Zod + campos). Seguros para el
 * navegador: no importan ExcelJS ni la lógica de construcción.
 */
export const FORM_LOADERS: Record<string, () => Promise<AnyTemplateForm>> = {
  "factura-con-isv": () => import("../facturacion/factura-con-isv/form").then((m) => m.form),
  "cotizacion-proforma": () =>
    import("../facturacion/cotizacion-proforma/form").then((m) => m.form),
  "orden-de-compra": () => import("../facturacion/orden-de-compra/form").then((m) => m.form),
  "nota-de-credito-debito": () =>
    import("../facturacion/nota-de-credito-debito/form").then((m) => m.form),
  "reporte-de-ventas": () => import("../facturacion/reporte-de-ventas/form").then((m) => m.form),
  "caja-diaria-arqueo": () => import("../facturacion/caja-diaria-arqueo/form").then((m) => m.form),
  "cuentas-por-cobrar-pagar": () =>
    import("../facturacion/cuentas-por-cobrar-pagar/form").then((m) => m.form),
  "estado-de-cuenta-cliente": () =>
    import("../facturacion/estado-de-cuenta-cliente/form").then((m) => m.form),
  "recibo-de-pago": () => import("../facturacion/recibo-de-pago/form").then((m) => m.form),
  "libro-de-ventas-y-compras": () =>
    import("../facturacion/libro-de-ventas-y-compras/form").then((m) => m.form),
  "ventas-por-vendedor-comisiones": () =>
    import("../facturacion/ventas-por-vendedor-comisiones/form").then((m) => m.form),
};
