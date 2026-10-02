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
  "declaracion-mensual-isv": () =>
    import("../impuestos/declaracion-mensual-isv").then((m) => m.default),
  "isr-personas-naturales": () =>
    import("../impuestos/isr-personas-naturales").then((m) => m.default),
  "calendario-tributario": () =>
    import("../impuestos/calendario-tributario").then((m) => m.default),
  "flujo-de-caja": () => import("../impuestos/flujo-de-caja").then((m) => m.default),
  "catalogo-de-cuentas": () => import("../impuestos/catalogo-de-cuentas").then((m) => m.default),
  "conciliacion-bancaria": () =>
    import("../impuestos/conciliacion-bancaria").then((m) => m.default),
  "punto-de-equilibrio": () => import("../impuestos/punto-de-equilibrio").then((m) => m.default),
  "libro-diario-mayor": () => import("../impuestos/libro-diario-mayor").then((m) => m.default),
  "activos-fijos-depreciacion": () =>
    import("../impuestos/activos-fijos-depreciacion").then((m) => m.default),
  "estado-de-resultados-balance": () =>
    import("../impuestos/estado-de-resultados-balance").then((m) => m.default),
  "presupuesto-anual": () => import("../impuestos/presupuesto-anual").then((m) => m.default),
  "simulador-de-prestamos": () =>
    import("../finanzas-personales/simulador-de-prestamos").then((m) => m.default),
  "prestamo-de-vivienda": () =>
    import("../finanzas-personales/prestamo-de-vivienda").then((m) => m.default),
  "inventario-stock-minimo": () =>
    import("../inventario/inventario-stock-minimo").then((m) => m.default),
  kardex: () => import("../inventario/kardex").then((m) => m.default),
  "control-de-fiados": () => import("../inventario/control-de-fiados").then((m) => m.default),
  "lista-de-precios-margen": () =>
    import("../inventario/lista-de-precios-margen").then((m) => m.default),
  "presupuesto-mensual": () =>
    import("../finanzas-personales/presupuesto-mensual").then((m) => m.default),
  "gastos-e-ingresos": () =>
    import("../finanzas-personales/gastos-e-ingresos").then((m) => m.default),
  "control-de-remesas": () =>
    import("../finanzas-personales/control-de-remesas").then((m) => m.default),
  "cuotas-patronato": () => import("../comunidad/cuotas-patronato").then((m) => m.default),
  "cajas-de-ahorro-cooperativas": () =>
    import("../comunidad/cajas-de-ahorro-cooperativas").then((m) => m.default),
  "control-de-alquileres": () =>
    import("../bienes-raices/control-de-alquileres").then((m) => m.default),
  "notas-y-promedios": () => import("../educacion/notas-y-promedios").then((m) => m.default),
  "pensiones-y-mensualidades": () =>
    import("../educacion/pensiones-y-mensualidades").then((m) => m.default),
  "prestamos-a-empleados": () => import("../planilla/prestamos-a-empleados").then((m) => m.default),
  "comisiones-y-bonos": () => import("../planilla/comisiones-y-bonos").then((m) => m.default),
  "evaluacion-de-desempeno": () =>
    import("../planilla/evaluacion-de-desempeno").then((m) => m.default),
  "inventario-por-lote-vencimiento": () =>
    import("../inventario/inventario-por-lote-vencimiento").then((m) => m.default),
  "pedidos-y-entregas": () => import("../inventario/pedidos-y-entregas").then((m) => m.default),
  "ventas-por-whatsapp": () => import("../inventario/ventas-por-whatsapp").then((m) => m.default),
};

export async function loadServerTemplate(slug: string): Promise<AnyTemplateDefinition | null> {
  const loader = SERVER_TEMPLATES[slug];
  return loader ? loader() : null;
}
