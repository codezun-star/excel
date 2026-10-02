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
  "declaracion-mensual-isv": () =>
    import("../impuestos/declaracion-mensual-isv/form").then((m) => m.form),
  "isr-personas-naturales": () =>
    import("../impuestos/isr-personas-naturales/form").then((m) => m.form),
  "calendario-tributario": () =>
    import("../impuestos/calendario-tributario/form").then((m) => m.form),
  "flujo-de-caja": () => import("../impuestos/flujo-de-caja/form").then((m) => m.form),
  "catalogo-de-cuentas": () => import("../impuestos/catalogo-de-cuentas/form").then((m) => m.form),
  "conciliacion-bancaria": () =>
    import("../impuestos/conciliacion-bancaria/form").then((m) => m.form),
  "punto-de-equilibrio": () => import("../impuestos/punto-de-equilibrio/form").then((m) => m.form),
  "libro-diario-mayor": () => import("../impuestos/libro-diario-mayor/form").then((m) => m.form),
  "activos-fijos-depreciacion": () =>
    import("../impuestos/activos-fijos-depreciacion/form").then((m) => m.form),
  "estado-de-resultados-balance": () =>
    import("../impuestos/estado-de-resultados-balance/form").then((m) => m.form),
  "presupuesto-anual": () => import("../impuestos/presupuesto-anual/form").then((m) => m.form),
  "simulador-de-prestamos": () =>
    import("../finanzas-personales/simulador-de-prestamos/form").then((m) => m.form),
  "prestamo-de-vivienda": () =>
    import("../finanzas-personales/prestamo-de-vivienda/form").then((m) => m.form),
  "inventario-stock-minimo": () =>
    import("../inventario/inventario-stock-minimo/form").then((m) => m.form),
  kardex: () => import("../inventario/kardex/form").then((m) => m.form),
  "control-de-fiados": () => import("../inventario/control-de-fiados/form").then((m) => m.form),
  "lista-de-precios-margen": () =>
    import("../inventario/lista-de-precios-margen/form").then((m) => m.form),
  "presupuesto-mensual": () =>
    import("../finanzas-personales/presupuesto-mensual/form").then((m) => m.form),
  "gastos-e-ingresos": () =>
    import("../finanzas-personales/gastos-e-ingresos/form").then((m) => m.form),
  "control-de-remesas": () =>
    import("../finanzas-personales/control-de-remesas/form").then((m) => m.form),
  "cuotas-patronato": () => import("../comunidad/cuotas-patronato/form").then((m) => m.form),
  "cajas-de-ahorro-cooperativas": () =>
    import("../comunidad/cajas-de-ahorro-cooperativas/form").then((m) => m.form),
  "control-de-alquileres": () =>
    import("../bienes-raices/control-de-alquileres/form").then((m) => m.form),
  "notas-y-promedios": () => import("../educacion/notas-y-promedios/form").then((m) => m.form),
  "pensiones-y-mensualidades": () =>
    import("../educacion/pensiones-y-mensualidades/form").then((m) => m.form),
  "prestamos-a-empleados": () =>
    import("../planilla/prestamos-a-empleados/form").then((m) => m.form),
  "comisiones-y-bonos": () => import("../planilla/comisiones-y-bonos/form").then((m) => m.form),
  "evaluacion-de-desempeno": () =>
    import("../planilla/evaluacion-de-desempeno/form").then((m) => m.form),
  "inventario-por-lote-vencimiento": () =>
    import("../inventario/inventario-por-lote-vencimiento/form").then((m) => m.form),
  "pedidos-y-entregas": () => import("../inventario/pedidos-y-entregas/form").then((m) => m.form),
  "ventas-por-whatsapp": () => import("../inventario/ventas-por-whatsapp/form").then((m) => m.form),
  pulperia: () => import("../negocios/pulperia/form").then((m) => m.form),
  "taller-mecanico": () => import("../negocios/taller-mecanico/form").then((m) => m.form),
  "barberia-salon": () => import("../negocios/barberia-salon/form").then((m) => m.form),
  "transporte-taxis": () => import("../negocios/transporte-taxis/form").then((m) => m.form),
  ferreteria: () => import("../negocios/ferreteria/form").then((m) => m.form),
  "restaurante-costos-recetas": () =>
    import("../negocios/restaurante-costos-recetas/form").then((m) => m.form),
  farmacia: () => import("../negocios/farmacia/form").then((m) => m.form),
  "tienda-de-ropa": () => import("../negocios/tienda-de-ropa/form").then((m) => m.form),
  "cafeteria-panaderia": () => import("../negocios/cafeteria-panaderia/form").then((m) => m.form),
  "servicios-freelancers": () =>
    import("../negocios/servicios-freelancers/form").then((m) => m.form),
  "constructora-presupuesto-de-obra": () =>
    import("../negocios/constructora-presupuesto-de-obra/form").then((m) => m.form),
  "agricultura-cafe-ganaderia": () =>
    import("../negocios/agricultura-cafe-ganaderia/form").then((m) => m.form),
  "camaroneras-pesca": () => import("../negocios/camaroneras-pesca/form").then((m) => m.form),
  "deudas-y-tarjetas": () =>
    import("../finanzas-personales/deudas-y-tarjetas/form").then((m) => m.form),
  "ahorro-por-metas": () =>
    import("../finanzas-personales/ahorro-por-metas/form").then((m) => m.form),
  "comprar-vs-alquilar": () =>
    import("../finanzas-personales/comprar-vs-alquilar/form").then((m) => m.form),
  jubilacion: () => import("../finanzas-personales/jubilacion/form").then((m) => m.form),
  "pagos-de-servicios": () =>
    import("../finanzas-personales/pagos-de-servicios/form").then((m) => m.form),
  "presupuesto-de-bodas-eventos": () =>
    import("../finanzas-personales/presupuesto-de-bodas-eventos/form").then((m) => m.form),
  "lista-del-super": () =>
    import("../finanzas-personales/lista-del-super/form").then((m) => m.form),
  "contabilidad-de-iglesias": () =>
    import("../comunidad/contabilidad-de-iglesias/form").then((m) => m.form),
  "rifas-y-colectas": () => import("../comunidad/rifas-y-colectas/form").then((m) => m.form),
  "aportes-asociaciones": () =>
    import("../comunidad/aportes-asociaciones/form").then((m) => m.form),
  "administracion-de-condominios": () =>
    import("../comunidad/administracion-de-condominios/form").then((m) => m.form),
  "contrato-de-arrendamiento": () =>
    import("../bienes-raices/contrato-de-arrendamiento/form").then((m) => m.form),
  "gastos-de-propiedades": () =>
    import("../bienes-raices/gastos-de-propiedades/form").then((m) => m.form),
  "rentabilidad-inmobiliaria": () =>
    import("../bienes-raices/rentabilidad-inmobiliaria/form").then((m) => m.form),
  "ventas-de-lotes-a-plazos": () =>
    import("../bienes-raices/ventas-de-lotes-a-plazos/form").then((m) => m.form),
};
