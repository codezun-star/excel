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
  "flujo-de-caja": () => import("../impuestos/flujo-de-caja/build").then((m) => m.build),
  "catalogo-de-cuentas": () =>
    import("../impuestos/catalogo-de-cuentas/build").then((m) => m.build),
  "conciliacion-bancaria": () =>
    import("../impuestos/conciliacion-bancaria/build").then((m) => m.build),
  "punto-de-equilibrio": () =>
    import("../impuestos/punto-de-equilibrio/build").then((m) => m.build),
  "presupuesto-anual": () => import("../impuestos/presupuesto-anual/build").then((m) => m.build),
  "simulador-de-prestamos": () =>
    import("../finanzas-personales/simulador-de-prestamos/build").then((m) => m.build),
  "prestamo-de-vivienda": () =>
    import("../finanzas-personales/prestamo-de-vivienda/build").then((m) => m.build),
  "inventario-stock-minimo": () =>
    import("../inventario/inventario-stock-minimo/build").then((m) => m.build),
  kardex: () => import("../inventario/kardex/build").then((m) => m.build),
  "control-de-fiados": () => import("../inventario/control-de-fiados/build").then((m) => m.build),
  "lista-de-precios-margen": () =>
    import("../inventario/lista-de-precios-margen/build").then((m) => m.build),
  "presupuesto-mensual": () =>
    import("../finanzas-personales/presupuesto-mensual/build").then((m) => m.build),
  "gastos-e-ingresos": () =>
    import("../finanzas-personales/gastos-e-ingresos/build").then((m) => m.build),
  "control-de-remesas": () =>
    import("../finanzas-personales/control-de-remesas/build").then((m) => m.build),
  "cuotas-patronato": () => import("../comunidad/cuotas-patronato/build").then((m) => m.build),
  "cajas-de-ahorro-cooperativas": () =>
    import("../comunidad/cajas-de-ahorro-cooperativas/build").then((m) => m.build),
  "control-de-alquileres": () =>
    import("../bienes-raices/control-de-alquileres/build").then((m) => m.build),
  "notas-y-promedios": () => import("../educacion/notas-y-promedios/build").then((m) => m.build),
  "pensiones-y-mensualidades": () =>
    import("../educacion/pensiones-y-mensualidades/build").then((m) => m.build),
  "prestamos-a-empleados": () =>
    import("../planilla/prestamos-a-empleados/build").then((m) => m.build),
  "evaluacion-de-desempeno": () =>
    import("../planilla/evaluacion-de-desempeno/build").then((m) => m.build),
  "pedidos-y-entregas": () => import("../inventario/pedidos-y-entregas/build").then((m) => m.build),
  "ventas-por-whatsapp": () =>
    import("../inventario/ventas-por-whatsapp/build").then((m) => m.build),
  pulperia: () => import("../negocios/pulperia/build").then((m) => m.build),
  "taller-mecanico": () => import("../negocios/taller-mecanico/build").then((m) => m.build),
  "barberia-salon": () => import("../negocios/barberia-salon/build").then((m) => m.build),
  "transporte-taxis": () => import("../negocios/transporte-taxis/build").then((m) => m.build),
  ferreteria: () => import("../negocios/ferreteria/build").then((m) => m.build),
  "tienda-de-ropa": () => import("../negocios/tienda-de-ropa/build").then((m) => m.build),
  "cafeteria-panaderia": () => import("../negocios/cafeteria-panaderia/build").then((m) => m.build),
  "servicios-freelancers": () =>
    import("../negocios/servicios-freelancers/build").then((m) => m.build),
  "agricultura-cafe-ganaderia": () =>
    import("../negocios/agricultura-cafe-ganaderia/build").then((m) => m.build),
  "deudas-y-tarjetas": () =>
    import("../finanzas-personales/deudas-y-tarjetas/build").then((m) => m.build),
  "ahorro-por-metas": () =>
    import("../finanzas-personales/ahorro-por-metas/build").then((m) => m.build),
  "comprar-vs-alquilar": () =>
    import("../finanzas-personales/comprar-vs-alquilar/build").then((m) => m.build),
  jubilacion: () => import("../finanzas-personales/jubilacion/build").then((m) => m.build),
  "pagos-de-servicios": () =>
    import("../finanzas-personales/pagos-de-servicios/build").then((m) => m.build),
  "presupuesto-de-bodas-eventos": () =>
    import("../finanzas-personales/presupuesto-de-bodas-eventos/build").then((m) => m.build),
  "lista-del-super": () =>
    import("../finanzas-personales/lista-del-super/build").then((m) => m.build),
};
