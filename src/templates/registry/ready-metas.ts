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
];
