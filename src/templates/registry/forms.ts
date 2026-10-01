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
  "planilla-de-sueldos": () => import("../planilla/planilla-de-sueldos/form").then((m) => m.form),
  "decimo-tercer-y-cuarto-mes": () =>
    import("../planilla/decimo-tercer-y-cuarto-mes/form").then((m) => m.form),
  "prestaciones-laborales": () =>
    import("../planilla/prestaciones-laborales/form").then((m) => m.form),
  "horas-extra": () => import("../planilla/horas-extra/form").then((m) => m.form),
  "salario-minimo": () => import("../planilla/salario-minimo/form").then((m) => m.form),
  "control-de-vacaciones": () =>
    import("../planilla/control-de-vacaciones/form").then((m) => m.form),
  "control-de-asistencia": () =>
    import("../planilla/control-de-asistencia/form").then((m) => m.form),
  "horarios-y-turnos": () => import("../planilla/horarios-y-turnos/form").then((m) => m.form),
  "boleta-de-pago": () => import("../planilla/boleta-de-pago/form").then((m) => m.form),
};
