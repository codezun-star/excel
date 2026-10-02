import type { TemplateMeta } from "../types";

import { meta as facturaConIsv } from "../facturacion/factura-con-isv/meta";
import { meta as cotizacionProforma } from "../facturacion/cotizacion-proforma/meta";
import { meta as ordenDeCompra } from "../facturacion/orden-de-compra/meta";
import { meta as notaDeCreditoDebito } from "../facturacion/nota-de-credito-debito/meta";
import { meta as reporteDeVentas } from "../facturacion/reporte-de-ventas/meta";
import { meta as cajaDiariaArqueo } from "../facturacion/caja-diaria-arqueo/meta";
import { meta as cuentasPorCobrarPagar } from "../facturacion/cuentas-por-cobrar-pagar/meta";
import { meta as estadoDeCuentaCliente } from "../facturacion/estado-de-cuenta-cliente/meta";
import { meta as reciboDePago } from "../facturacion/recibo-de-pago/meta";
import { meta as libroDeVentasYCompras } from "../facturacion/libro-de-ventas-y-compras/meta";
import { meta as ventasPorVendedorComisiones } from "../facturacion/ventas-por-vendedor-comisiones/meta";
import { meta as planillaDeSueldos } from "../planilla/planilla-de-sueldos/meta";
import { meta as decimoTercerYCuartoMes } from "../planilla/decimo-tercer-y-cuarto-mes/meta";
import { meta as prestacionesLaborales } from "../planilla/prestaciones-laborales/meta";
import { meta as horasExtra } from "../planilla/horas-extra/meta";
import { meta as salarioMinimo } from "../planilla/salario-minimo/meta";
import { meta as controlDeVacaciones } from "../planilla/control-de-vacaciones/meta";
import { meta as controlDeAsistencia } from "../planilla/control-de-asistencia/meta";
import { meta as horariosYTurnos } from "../planilla/horarios-y-turnos/meta";
import { meta as boletaDePago } from "../planilla/boleta-de-pago/meta";
import { meta as declaracionMensualIsv } from "../impuestos/declaracion-mensual-isv/meta";
import { meta as isrPersonasNaturales } from "../impuestos/isr-personas-naturales/meta";
import { meta as calendarioTributario } from "../impuestos/calendario-tributario/meta";
import { meta as flujoDeCaja } from "../impuestos/flujo-de-caja/meta";
import { meta as catalogoDeCuentas } from "../impuestos/catalogo-de-cuentas/meta";
import { meta as conciliacionBancaria } from "../impuestos/conciliacion-bancaria/meta";
import { meta as puntoDeEquilibrio } from "../impuestos/punto-de-equilibrio/meta";
import { meta as libroDiarioMayor } from "../impuestos/libro-diario-mayor/meta";
import { meta as activosFijosDepreciacion } from "../impuestos/activos-fijos-depreciacion/meta";
import { meta as estadoDeResultadosBalance } from "../impuestos/estado-de-resultados-balance/meta";
import { meta as presupuestoAnual } from "../impuestos/presupuesto-anual/meta";
import { meta as simuladorDePrestamos } from "../finanzas-personales/simulador-de-prestamos/meta";
import { meta as prestamoDeVivienda } from "../finanzas-personales/prestamo-de-vivienda/meta";
import { meta as inventarioStockMinimo } from "../inventario/inventario-stock-minimo/meta";
import { meta as kardex } from "../inventario/kardex/meta";
import { meta as controlDeFiados } from "../inventario/control-de-fiados/meta";
import { meta as listaDePreciosMargen } from "../inventario/lista-de-precios-margen/meta";
import { meta as presupuestoMensual } from "../finanzas-personales/presupuesto-mensual/meta";
import { meta as gastosEIngresos } from "../finanzas-personales/gastos-e-ingresos/meta";
import { meta as controlDeRemesas } from "../finanzas-personales/control-de-remesas/meta";
import { meta as cuotasPatronato } from "../comunidad/cuotas-patronato/meta";
import { meta as cajasDeAhorroCooperativas } from "../comunidad/cajas-de-ahorro-cooperativas/meta";
import { meta as controlDeAlquileres } from "../bienes-raices/control-de-alquileres/meta";
import { meta as notasYPromedios } from "../educacion/notas-y-promedios/meta";
import { meta as pensionesYMensualidades } from "../educacion/pensiones-y-mensualidades/meta";
import { meta as prestamosAEmpleados } from "../planilla/prestamos-a-empleados/meta";
import { meta as comisionesYBonos } from "../planilla/comisiones-y-bonos/meta";
import { meta as evaluacionDeDesempeno } from "../planilla/evaluacion-de-desempeno/meta";
import { meta as inventarioPorLoteVencimiento } from "../inventario/inventario-por-lote-vencimiento/meta";
import { meta as pedidosYEntregas } from "../inventario/pedidos-y-entregas/meta";
import { meta as ventasPorWhatsapp } from "../inventario/ventas-por-whatsapp/meta";
import { meta as pulperia } from "../negocios/pulperia/meta";
import { meta as tallerMecanico } from "../negocios/taller-mecanico/meta";
import { meta as barberiaSalon } from "../negocios/barberia-salon/meta";
import { meta as transporteTaxis } from "../negocios/transporte-taxis/meta";
import { meta as ferreteria } from "../negocios/ferreteria/meta";
import { meta as restauranteCostosRecetas } from "../negocios/restaurante-costos-recetas/meta";
import { meta as farmacia } from "../negocios/farmacia/meta";
import { meta as tiendaDeRopa } from "../negocios/tienda-de-ropa/meta";
import { meta as cafeteriaPanaderia } from "../negocios/cafeteria-panaderia/meta";
import { meta as serviciosFreelancers } from "../negocios/servicios-freelancers/meta";
import { meta as constructoraPresupuestoDeObra } from "../negocios/constructora-presupuesto-de-obra/meta";
import { meta as agriculturaCafeGanaderia } from "../negocios/agricultura-cafe-ganaderia/meta";
import { meta as camaronerasPesca } from "../negocios/camaroneras-pesca/meta";

/**
 * Metadatos de las plantillas implementadas (status "ready").
 * Al implementar una plantilla nueva:
 *   1. Agrega aquí su meta.
 *   2. Agrega su cargador en registry/forms.ts y registry/server.ts.
 *   3. Si es "free", agrega su build en registry/client-builders.ts.
 *   4. Quita su entrada de coming-soon.ts.
 */
export const READY_METAS: (TemplateMeta & { status: "ready" })[] = [
  facturaConIsv,
  cotizacionProforma,
  ordenDeCompra,
  notaDeCreditoDebito,
  reporteDeVentas,
  cajaDiariaArqueo,
  cuentasPorCobrarPagar,
  estadoDeCuentaCliente,
  reciboDePago,
  libroDeVentasYCompras,
  ventasPorVendedorComisiones,
  planillaDeSueldos,
  decimoTercerYCuartoMes,
  prestacionesLaborales,
  horasExtra,
  salarioMinimo,
  controlDeVacaciones,
  controlDeAsistencia,
  horariosYTurnos,
  boletaDePago,
  declaracionMensualIsv,
  isrPersonasNaturales,
  calendarioTributario,
  flujoDeCaja,
  catalogoDeCuentas,
  conciliacionBancaria,
  puntoDeEquilibrio,
  libroDiarioMayor,
  activosFijosDepreciacion,
  estadoDeResultadosBalance,
  presupuestoAnual,
  simuladorDePrestamos,
  prestamoDeVivienda,
  inventarioStockMinimo,
  kardex,
  controlDeFiados,
  listaDePreciosMargen,
  presupuestoMensual,
  gastosEIngresos,
  controlDeRemesas,
  cuotasPatronato,
  cajasDeAhorroCooperativas,
  controlDeAlquileres,
  notasYPromedios,
  pensionesYMensualidades,
  prestamosAEmpleados,
  comisionesYBonos,
  evaluacionDeDesempeno,
  inventarioPorLoteVencimiento,
  pedidosYEntregas,
  ventasPorWhatsapp,
  pulperia,
  tallerMecanico,
  barberiaSalon,
  transporteTaxis,
  ferreteria,
  restauranteCostosRecetas,
  farmacia,
  tiendaDeRopa,
  cafeteriaPanaderia,
  serviciosFreelancers,
  constructoraPresupuestoDeObra,
  agriculturaCafeGanaderia,
  camaronerasPesca,
];
