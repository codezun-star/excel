import type ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { HN } from "@/countries/hn";
import type { EvaluatedWorkbook } from "@/test/formula-engine";
import { buildExample, tableRow, valueRightOf } from "@/test/template-helpers";

/** Primeros `count` valores calculados debajo del encabezado indicado. */
function columnBelow(
  wb: ExcelJS.Workbook,
  ev: EvaluatedWorkbook,
  sheet: string,
  header: string,
  count: number,
): unknown[] {
  const ws = wb.getWorksheet(sheet)!;
  let at: ExcelJS.Cell | null = null;
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      if (!at && cell.value === header) at = cell;
    }),
  );
  if (!at) throw new Error(`No se encontró "${header}" en ${sheet}`);
  const { row, col } = at as ExcelJS.Cell;
  return Array.from({ length: count }, (_, i) =>
    ev.value(sheet, ws.getCell(Number(row) + 1 + i, Number(col)).address),
  );
}

/** Texto calculado de la primera celda de la columna A que empieza con `prefix`. */
function paragraphStarting(
  wb: ExcelJS.Workbook,
  ev: EvaluatedWorkbook,
  sheet: string,
  prefix: string,
): string {
  const ws = wb.getWorksheet(sheet)!;
  for (let r = 1; r <= ws.rowCount; r++) {
    const v = ev.value(sheet, `A${r}`);
    if (typeof v === "string" && v.startsWith(prefix)) return v;
  }
  throw new Error(`No se encontró un párrafo que empiece con "${prefix}"`);
}

/** Número de serie de Excel de una fecha ISO. */
const serial = (iso: string) =>
  (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86_400_000;
const isoFromToday = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const pmt = (principal: number, monthlyRate: number, months: number) =>
  monthlyRate === 0
    ? principal / months
    : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

/** Resultados clave de las plantillas agregadas después de la primera versión. */
describe("cálculos de plantillas (segunda ola)", () => {
  it("prestamos-a-empleados: cuota, abonos, saldo y estado", async () => {
    const { wb, ev } = await buildExample("prestamos-a-empleados");
    expect(tableRow(wb, ev, "Préstamos", "Empleado", "Ana López")).toMatchObject({
      "N.º": "P-001",
      Cuota: 1000,
      Abonado: 2000,
      Saldo: 4000,
      "Descontar este mes": 1000,
      Estado: "Activo",
    });
    expect(tableRow(wb, ev, "Préstamos", "Empleado", "Carlos Mejía")).toMatchObject({
      Saldo: 0,
      Estado: "Pagado",
    });
    expect(tableRow(wb, ev, "Abonos", "Fecha", "P-002")).toMatchObject({
      Empleado: "Carlos Mejía",
    });
    expect(valueRightOf(wb, ev, "Préstamos", "Saldo pendiente total")).toBe(4000);
  });

  it("comisiones-y-bonos: tramo, bono por meta y extra sobre excedente", async () => {
    const { wb, ev } = await buildExample("comisiones-y-bonos");
    expect(tableRow(wb, ev, "Comisiones", "Vendedor", "María Rodríguez")).toMatchObject({
      "% comisión": 0.04,
      Comisión: 7280,
      "Bono por meta": 1000,
      "Extra sobre excedente": 320,
      "Total a pagar": 20600,
    });
    expect(tableRow(wb, ev, "Comisiones", "Vendedor", "José Hernández")).toMatchObject({
      Comisión: 2880,
      "Bono por meta": 0,
      "Total a pagar": 14880,
    });
    expect(valueRightOf(wb, ev, "Comisiones", "Vendedores que alcanzaron el bono")).toBe(2);
  });

  it("evaluacion-de-desempeno: puntaje ponderado y calificación", async () => {
    const { wb, ev } = await buildExample("evaluacion-de-desempeno");
    expect(tableRow(wb, ev, "Evaluación", "Empleado", "Ana López")).toMatchObject({
      "Puntaje (1 a 5)": 4.5,
      Calificación: "Excelente",
    });
    expect(tableRow(wb, ev, "Evaluación", "Empleado", "Carlos Mejía")).toMatchObject({
      "Puntaje (1 a 5)": 3,
      Calificación: "Bueno",
    });
    expect(tableRow(wb, ev, "Evaluación", "Empleado", "Karla Flores")).toMatchObject({
      Calificación: "Muy bueno",
    });
  });

  it("inventario-por-lote-vencimiento: existencias, estados y valor en riesgo", async () => {
    const { wb, ev } = await buildExample("inventario-por-lote-vencimiento");
    expect(tableRow(wb, ev, "Lotes", "Producto", "Acetaminofén 500 mg (caja)")).toMatchObject({
      Existencia: 80,
      Estado: "OK",
    });
    expect(tableRow(wb, ev, "Lotes", "Producto", "Leche entera 1 L")).toMatchObject({
      Existencia: 19,
      Estado: "Por vencer",
    });
    expect(tableRow(wb, ev, "Lotes", "Producto", "Yogur de fresa")).toMatchObject({
      Estado: "Vencido",
    });
    expect(valueRightOf(wb, ev, "Lotes", "Valor vencido o por vencer")).toBe(788);
  });

  it("pedidos-y-entregas: saldos y alertas", async () => {
    const { wb, ev } = await buildExample("pedidos-y-entregas");
    expect(tableRow(wb, ev, "Pedidos", "Cliente", "Lucía Mendoza")).toMatchObject({
      Saldo: 600,
      Alerta: "Para hoy",
    });
    expect(tableRow(wb, ev, "Pedidos", "Cliente", "Escuela San José")).toMatchObject({
      Saldo: 2500,
      Alerta: "Atrasado",
    });
    expect(valueRightOf(wb, ev, "Pedidos", "Total por cobrar")).toBe(3100);
    expect(valueRightOf(wb, ev, "Pedidos", "Atrasados")).toBe(1);
  });

  it("ventas-por-whatsapp: totales, por cobrar y clientes frecuentes", async () => {
    const { wb, ev } = await buildExample("ventas-por-whatsapp");
    expect(valueRightOf(wb, ev, "Pedidos", "Ventas registradas")).toBe(2800);
    expect(valueRightOf(wb, ev, "Pedidos", "Por cobrar")).toBe(850);
    expect(tableRow(wb, ev, "Clientes", "Cliente", "Sofía Aguilar")).toMatchObject({
      Pedidos: 2,
      "Total comprado": 1950,
      Tipo: "Ocasional",
    });
  });

  it("pulperia: ventas, ganancia estimada, efectivo esperado y fiado pendiente", async () => {
    const { wb, ev } = await buildExample("pulperia");
    expect(valueRightOf(wb, ev, "Diario", "Ventas del mes")).toBe(15880);
    expect(valueRightOf(wb, ev, "Diario", "Ganancia estimada del mes")).toBe(2726);
    expect(valueRightOf(wb, ev, "Diario", "Fiado pendiente (todos los clientes)")).toBe(730);
    expect(tableRow(wb, ev, "Clientes", "Cliente", "Doña Rosa Martínez")).toMatchObject({
      Saldo: 80,
    });
  });

  it("taller-mecanico: repuestos por orden, impuesto y saldo", async () => {
    const { wb, ev } = await buildExample("taller-mecanico");
    expect(tableRow(wb, ev, "Órdenes", "Cliente", "Roberto Sánchez")).toMatchObject({
      Orden: "OT-001",
      Repuestos: 830,
      Total: 1414.5,
      Saldo: 914.5,
    });
    expect(valueRightOf(wb, ev, "Órdenes", "Saldo por cobrar")).toBe(2639.5);
    expect(valueRightOf(wb, ev, "Órdenes", "Listos para entregar")).toBe(1);
  });

  it("barberia-salon: precio de lista, comisión y pago por estilista", async () => {
    const { wb, ev } = await buildExample("barberia-salon");
    expect(tableRow(wb, ev, "Resumen", "Estilista", "Kevin")).toMatchObject({
      Servicios: 2,
      "Ventas (sin propina)": 370,
      Comisión: 148,
      Propinas: 30,
      "A pagar": 178,
    });
    expect(tableRow(wb, ev, "Resumen", "Estilista", "Andrea")).toMatchObject({ Comisión: 220 });
  });

  it("transporte-taxis: ganancia neta por unidad con mantenimiento", async () => {
    const { wb, ev } = await buildExample("transporte-taxis");
    expect(tableRow(wb, ev, "Resumen", "Unidad", "Taxi 01")).toMatchObject({
      "Días trabajados": 2,
      Ingresos: 2300,
      "Ganancia neta": 1380,
      "Faltó de la entrega": 0,
    });
    expect(tableRow(wb, ev, "Resumen", "Unidad", "Taxi 02")).toMatchObject({
      Mantenimiento: 900,
      "Ganancia neta": -280,
    });
  });

  it("ferreteria: alertas, cotización con impuesto y crédito vencido", async () => {
    const { wb, ev } = await buildExample("ferreteria");
    expect(valueRightOf(wb, ev, "Inventario", "Productos por pedir")).toBe(1);
    expect(valueRightOf(wb, ev, "Inventario", "Agotados")).toBe(1);
    expect(valueRightOf(wb, ev, "Cotización", "Total")).toBe(12075);
    expect(tableRow(wb, ev, "Cotización", "Código", "VAR-38")).toMatchObject({
      Disponible: "Revisar",
    });
    expect(valueRightOf(wb, ev, "Crédito", "Vencido")).toBe(8500);
  });

  it("restaurante-costos-recetas: costo por porción, food cost y precio sugerido", async () => {
    const { wb, ev } = await buildExample("restaurante-costos-recetas");
    expect(tableRow(wb, ev, "Platillos", "Platillo", "Plato típico")).toMatchObject({
      "Costo por porción": 40.63,
      "Precio sin impuesto": 121.74,
      "Precio sugerido sin impuesto": 135.43,
      Revisión: "Bien",
    });
    expect(tableRow(wb, ev, "Platillos", "Platillo", "Baleada sencilla")).toMatchObject({
      "Costo por porción": 7.75,
      Revisión: "Subir precio",
    });
  });

  it("farmacia: existencias por lote, vencimientos y valor en riesgo", async () => {
    const { wb, ev } = await buildExample("farmacia");
    expect(tableRow(wb, ev, "Lotes", "Lote", "A-1001")).toMatchObject({
      Existencia: 18,
      Estado: "OK",
    });
    expect(tableRow(wb, ev, "Lotes", "Lote", "X-2002")).toMatchObject({
      Existencia: 9,
      Estado: "Por vencer",
    });
    expect(tableRow(wb, ev, "Lotes", "Lote", "S-0501")).toMatchObject({
      Existencia: 40,
      Estado: "Vencido",
    });
    expect(valueRightOf(wb, ev, "Lotes", "Valor vencido o por vencer")).toBe(1560);
  });

  it("tienda-de-ropa: disponibles con ventas y apartados", async () => {
    const { wb, ev } = await buildExample("tienda-de-ropa");
    expect(tableRow(wb, ev, "Inventario", "Código", "BL-001-M")).toMatchObject({ Disponible: 4 });
    expect(tableRow(wb, ev, "Inventario", "Código", "VS-020-S")).toMatchObject({
      Apartado: 1,
      Disponible: 1,
    });
    expect(valueRightOf(wb, ev, "Inventario", "Ventas registradas")).toBe(1540);
    expect(valueRightOf(wb, ev, "Inventario", "Saldo de apartados activos")).toBe(550);
  });

  it("cafeteria-panaderia: merma, ventas y ganancia por producto", async () => {
    const { wb, ev } = await buildExample("cafeteria-panaderia");
    expect(tableRow(wb, ev, "Resumen", "Producto", "Pan francés")).toMatchObject({
      Producido: 1000,
      Vendido: 950,
      "% de merma": 0.05,
      Ventas: 2850,
      Ganancia: 1650,
    });
    expect(valueRightOf(wb, ev, "Resumen", "Ganancia del mes")).toBe(3510);
  });

  it("servicios-freelancers: por hora, precio fijo, pendiente y ganancia por hora", async () => {
    const { wb, ev } = await buildExample("servicios-freelancers");
    expect(tableRow(wb, ev, "Proyectos", "Cliente", "Café El Aroma")).toMatchObject({
      Horas: 10,
      "A cobrar": 5000,
      Pendiente: 2500,
      "Ganancia por hora": 500,
    });
    expect(tableRow(wb, ev, "Proyectos", "Cliente", "Hotel Brisas")).toMatchObject({
      Ganancia: 7400,
    });
    expect(valueRightOf(wb, ev, "Proyectos", "Pendiente de cobro")).toBe(2500);
  });

  it("constructora-presupuesto-de-obra: indirectos, utilidad, impuesto y avance", async () => {
    const { wb, ev } = await buildExample("constructora-presupuesto-de-obra");
    expect(valueRightOf(wb, ev, "Resumen", "Costo directo")).toBe(137400);
    expect(valueRightOf(wb, ev, "Resumen", "Total del presupuesto")).toBeCloseTo(196406.43, 2);
    expect(valueRightOf(wb, ev, "Resumen", "Avance físico-financiero")).toBeCloseTo(
      28500 / 137400,
      6,
    );
  });

  it("agricultura-cafe-ganaderia: costo por manzana, rendimiento y ganancia", async () => {
    const { wb, ev } = await buildExample("agricultura-cafe-ganaderia");
    expect(valueRightOf(wb, ev, "Resumen", "Costo por manzana")).toBe(10000);
    expect(valueRightOf(wb, ev, "Resumen", "Rendimiento (Quintal por manzana)")).toBe(20);
    expect(valueRightOf(wb, ev, "Resumen", "Costo por quintal")).toBe(500);
    expect(valueRightOf(wb, ev, "Resumen", "Ganancia de la temporada")).toBe(376000);
  });

  it("camaroneras-pesca: costo, FCR, rendimiento y días de cultivo", async () => {
    const { wb, ev } = await buildExample("camaroneras-pesca");
    expect(tableRow(wb, ev, "Estanques", "Estanque", "E-1")).toMatchObject({
      "Alimento (lb)": 7000,
      "Costo total": 156000,
      Ganancia: 174000,
      "Rendimiento (lb/ha)": 1200,
      "Conversión alimenticia (FCR)": 1.17,
      "Días de cultivo": 108,
    });
    expect(tableRow(wb, ev, "Estanques", "Estanque", "E-2")).toMatchObject({ Ganancia: 38500 });
  });

  it("deudas-y-tarjetas: orden bola de nieve, extra y meses para pagar", async () => {
    const { wb, ev } = await buildExample("deudas-y-tarjetas");
    expect(tableRow(wb, ev, "Deudas", "Deuda", "Tarjeta tienda")).toMatchObject({
      "Orden de pago": 1,
      "Pago con extra": 1100,
      "Meses para pagar": 7,
    });
    expect(tableRow(wb, ev, "Deudas", "Deuda", "Tarjeta Banco A")).toMatchObject({
      "Interés del mes": 810,
      "Orden de pago": 2,
      "Meses para pagar": 26,
    });
    expect(tableRow(wb, ev, "Deudas", "Deuda", "Préstamo cooperativa")).toMatchObject({
      "Meses para pagar": 27,
    });
    expect(valueRightOf(wb, ev, "Deudas", "Deuda total")).toBe(69000);
  });

  it("ahorro-por-metas: aportes, retiros, avance y faltante", async () => {
    const { wb, ev } = await buildExample("ahorro-por-metas");
    expect(tableRow(wb, ev, "Metas", "Meta", "Fondo de emergencia")).toMatchObject({
      Ahorrado: 5000,
      Falta: 25000,
    });
    expect(tableRow(wb, ev, "Metas", "Meta", "Viaje a Roatán")).toMatchObject({
      Ahorrado: 2000,
      Falta: 10000,
    });
    expect(valueRightOf(wb, ev, "Metas", "Total ahorrado")).toBe(7000);
  });

  it("comprar-vs-alquilar: cuota del préstamo y comparación", async () => {
    const { wb, ev } = await buildExample("comprar-vs-alquilar");
    const loan = 1_800_000 * 0.9;
    const r = 0.11 / 12;
    const pmt = (loan * r) / (1 - Math.pow(1 + r, -240));
    expect(valueRightOf(wb, ev, "Comparación", "Cuota mensual")).toBeCloseTo(pmt, 1);
    expect(["Comprar", "Alquilar"]).toContain(valueRightOf(wb, ev, "Comparación", "Conviene"));
  });

  it("jubilacion: renta mensual igual a PAGO sobre el ahorro acumulado", async () => {
    const { wb, ev } = await buildExample("jubilacion");
    const final = Number(valueRightOf(wb, ev, "Proyección", "Ahorro acumulado"));
    expect(final).toBeGreaterThan(20000);
    const r = 0.07 / 12;
    const income = (final * r) / (1 - Math.pow(1 + r, -240));
    expect(valueRightOf(wb, ev, "Proyección", "Renta mensual posible")).toBeCloseTo(income, 1);
  });

  it("pagos-de-servicios: totales y promedios por servicio", async () => {
    const { wb, ev } = await buildExample("pagos-de-servicios");
    expect(tableRow(wb, ev, "Servicios", "Servicio", "Energía eléctrica")).toMatchObject({
      "Total del año": 3750,
      "Promedio mensual": 1250,
    });
    expect(valueRightOf(wb, ev, "Servicios", "Gastado en el año")).toBe(7460);
  });

  it("presupuesto-de-bodas-eventos: saldos, disponible y costo por persona", async () => {
    const { wb, ev } = await buildExample("presupuesto-de-bodas-eventos");
    expect(valueRightOf(wb, ev, "Presupuesto", "Falta por pagar")).toBe(55000);
    expect(valueRightOf(wb, ev, "Presupuesto", "Disponible del presupuesto")).toBe(55000);
    expect(valueRightOf(wb, ev, "Presupuesto", "Costo por persona confirmada")).toBe(9500);
    expect(valueRightOf(wb, ev, "Invitados", "Personas confirmadas")).toBe(10);
  });

  it("lista-del-super: estimado, gastado y pendientes", async () => {
    const { wb, ev } = await buildExample("lista-del-super");
    expect(valueRightOf(wb, ev, "Lista", "Total estimado")).toBe(282);
    expect(valueRightOf(wb, ev, "Lista", "Gastado hasta ahora")).toBe(160);
    expect(valueRightOf(wb, ev, "Lista", "Te queda del presupuesto")).toBe(3840);
    expect(valueRightOf(wb, ev, "Lista", "Productos por comprar")).toBe(1);
  });

  it("contabilidad-de-iglesias: saldo mensual, categorías y aportes por miembro", async () => {
    const { wb, ev } = await buildExample("contabilidad-de-iglesias");
    expect(tableRow(wb, ev, "Informe", "Mes", "Enero")).toMatchObject({
      Ingresos: 3850,
      Egresos: 1800,
      Resultado: 2050,
      "Saldo en caja": 2050,
    });
    expect(tableRow(wb, ev, "Informe", "Mes", "Febrero")).toMatchObject({ "Saldo en caja": 1750 });
    expect(tableRow(wb, ev, "Informe", "Ingresos por categoría", "Diezmos")).toMatchObject({
      "Total del año": 2400,
    });
    expect(valueRightOf(wb, ev, "Informe", "Saldo actual")).toBe(1750);
    expect(tableRow(wb, ev, "Miembros", "Nombre", "Hna. Carmen López")).toMatchObject({
      "Total aportado": 900,
      Aportes: 1,
    });
  });

  it("rifas-y-colectas: boletos, cobros, ganancia neta y vendedores", async () => {
    const { wb, ev } = await buildExample("rifas-y-colectas");
    expect(tableRow(wb, ev, "Boletos", "Número", "03")).toMatchObject({
      Comprador: "Julia Ramos",
      Valor: 50,
      Cobrado: 50,
    });
    expect(tableRow(wb, ev, "Boletos", "Número", "01")).toMatchObject({ Cobrado: 0 });
    expect(valueRightOf(wb, ev, "Resumen", "Boletos vendidos")).toBe(4);
    expect(valueRightOf(wb, ev, "Resumen", "Boletos sin vender")).toBe(96);
    expect(valueRightOf(wb, ev, "Resumen", "Pendiente de cobro")).toBe(50);
    expect(valueRightOf(wb, ev, "Resumen", "Ganancia neta (cobrado + donaciones − gastos)")).toBe(
      800,
    );
    expect(valueRightOf(wb, ev, "Resumen", "Avance de la meta")).toBeCloseTo(0.08, 6);
    expect(tableRow(wb, ev, "Resumen", "Vendedor", "María")).toMatchObject({
      Boletos: 2,
      Vendido: 100,
      Cobrado: 50,
      "Por cobrar": 50,
    });
  });

  it("aportes-asociaciones: inscripción, morosos y saldo mes a mes", async () => {
    const { wb, ev } = await buildExample("aportes-asociaciones");
    expect(tableRow(wb, ev, "Socios", "Socio", "Juan Pérez")).toMatchObject({
      "Total pagado": 1100,
      "Debería llevar": 1100,
      Estado: "Al día",
    });
    expect(tableRow(wb, ev, "Socios", "Socio", "Marta Sánchez")).toMatchObject({
      "Total pagado": 700,
      "Saldo pendiente": 400,
      Estado: "Moroso",
    });
    expect(tableRow(wb, ev, "Resumen", "Mes", "Enero")).toMatchObject({ Cuotas: 600, Saldo: 750 });
    expect(tableRow(wb, ev, "Resumen", "Mes", "Febrero")).toMatchObject({
      "Aportes extra": 300,
      Saldo: 1450,
    });
    expect(valueRightOf(wb, ev, "Resumen", "Socios morosos")).toBe(2);
    expect(valueRightOf(wb, ev, "Resumen", "Saldo pendiente de socios")).toBe(900);
    expect(valueRightOf(wb, ev, "Resumen", "Saldo actual")).toBe(1450);
  });

  it("administracion-de-condominios: alícuota, cuota, estado de cuenta y ejecución", async () => {
    const { wb, ev } = await buildExample("administracion-de-condominios");
    const toCollect = 13300 * 1.1;
    expect(valueRightOf(wb, ev, "Presupuesto", "Total mensual a cobrar")).toBeCloseTo(toCollect, 2);
    const a2 = tableRow(wb, ev, "Cuotas", "Unidad", "Casa A-2");
    expect(a2["Alícuota"]).toBeCloseTo(150 / 540, 6);
    expect(a2["Cuota mensual"]).toBeCloseTo(4063.89, 2);
    expect(a2.Estado).toBe("Moroso");
    expect(tableRow(wb, ev, "Cuotas", "Unidad", "Casa A-1").Estado).toBe("Al día");
    expect(valueRightOf(wb, ev, "Estado de cuenta", "Saldo vencido")).toBeCloseTo(8127.78, 2);
    expect(valueRightOf(wb, ev, "Estado de cuenta", "Recargo por mora")).toBeCloseTo(406.39, 2);
    expect(valueRightOf(wb, ev, "Estado de cuenta", "Total a pagar")).toBeCloseTo(8534.17, 2);
    expect(tableRow(wb, ev, "Resumen", "Mes", "Enero")).toMatchObject({
      Presupuesto: 13300,
      "Gasto real": 7150,
      Diferencia: 6150,
    });
    expect(tableRow(wb, ev, "Resumen", "Mes", "Enero")["Saldo en caja"]).toBeCloseTo(
      14630 - 7150,
      2,
    );
    const vig = tableRow(wb, ev, "Resumen", "Ejecución por categoría", "Vigilancia");
    expect(vig).toMatchObject({
      "Presupuesto anual": 72000,
      "Gasto real": 12000,
      Disponible: 60000,
    });
    expect(vig["% ejecutado"]).toBeCloseTo(1 / 6, 6);
    expect(valueRightOf(wb, ev, "Resumen", "Unidades morosas")).toBe(2);
  });

  it("contrato-de-arrendamiento: cláusulas con renta en letras y calendario", async () => {
    const { wb, ev } = await buildExample("contrato-de-arrendamiento");
    expect(paragraphStarting(wb, ev, "Contrato", "TERCERA")).toContain(
      "OCHO MIL LEMPIRAS CON 00/100 (L 8,000.00)",
    );
    expect(paragraphStarting(wb, ev, "Contrato", "SEGUNDA")).toContain("12 meses");
    expect(paragraphStarting(wb, ev, "Contrato", "OCTAVA")).toContain("mascota");
    expect(paragraphStarting(wb, ev, "Contrato", "NOVENA")).toContain("Honduras");
    expect(columnBelow(wb, ev, "Calendario de pagos", "Estado", 2)).toEqual([
      "Pagado",
      "Pendiente",
    ]);
    expect(columnBelow(wb, ev, "Calendario de pagos", "N.º", 13)[12]).toBe("");
    expect(valueRightOf(wb, ev, "Calendario de pagos", "Valor total del contrato")).toBe(96000);
    expect(valueRightOf(wb, ev, "Calendario de pagos", "Pagado a la fecha")).toBe(8000);
  });

  it("gastos-de-propiedades: resultado y rendimiento por propiedad", async () => {
    const { wb, ev } = await buildExample("gastos-de-propiedades");
    const casa = tableRow(wb, ev, "Propiedades", "Propiedad", "Casa Col. Kennedy");
    expect(casa).toMatchObject({
      "Ingresos del año": 9000,
      "Gastos del año": 3050,
      "Resultado neto": 5950,
    });
    expect(casa["Rendimiento anual"]).toBeCloseTo(5950 / 1_800_000, 8);
    expect(tableRow(wb, ev, "Propiedades", "Propiedad", "Local Barrio Abajo")).toMatchObject({
      "Resultado neto": 24000,
      "% de los gastos": 0,
    });
    expect(tableRow(wb, ev, "Resumen", "Mes", "Enero")).toMatchObject({
      Ingresos: 21000,
      Gastos: 650,
      Resultado: 20350,
    });
    expect(
      tableRow(wb, ev, "Resumen", "Gastos por categoría", "Impuesto de bienes inmuebles"),
    ).toMatchObject({
      "Total del año": 2400,
    });
  });

  it("rentabilidad-inmobiliaria: cuota, flujo, saldo del préstamo y TIR", async () => {
    const { wb, ev } = await buildExample("rentabilidad-inmobiliaria");
    const price = 2_200_000;
    const loan = price * 0.8;
    const payment = pmt(loan, 0.11 / 12, 240);
    expect(valueRightOf(wb, ev, "Análisis", "Inversión inicial en efectivo")).toBeCloseTo(
      price * 0.2 + price * 0.04 + 80000,
      2,
    );
    expect(valueRightOf(wb, ev, "Análisis", "Cuota mensual del préstamo")).toBeCloseTo(payment, 2);
    const effective = 15000 * 12 * 0.92;
    const opex = Math.round(price * 0.0035) + Math.round(price * 0.003) + effective * 0.06;
    const noi = effective - opex;
    expect(valueRightOf(wb, ev, "Análisis", "Ingreso neto operativo (NOI)")).toBeCloseTo(noi, 2);
    expect(valueRightOf(wb, ev, "Análisis", "Flujo de caja del año 1")).toBeCloseTo(
      noi - payment * 12,
      2,
    );
    const r = 0.11 / 12;
    const balance10 = loan * Math.pow(1 + r, 120) - payment * ((Math.pow(1 + r, 120) - 1) / r);
    expect(columnBelow(wb, ev, "Análisis", "Saldo del préstamo", 11)[10]).toBeCloseTo(balance10, 2);
    expect(columnBelow(wb, ev, "Análisis", "Año", 12)[11]).toBe("");
    const flows = columnBelow(wb, ev, "Análisis", "Flujo con venta", 11).map(Number);
    const irr = Number(valueRightOf(wb, ev, "Análisis", "TIR al vender al final"));
    const npv = flows.reduce((acc, f, i) => acc + f / Math.pow(1 + irr, i), 0);
    expect(Math.abs(npv)).toBeLessThan(1);
    expect(tableRow(wb, ev, "Comparar", "Concepto", "Préstamo")["Propiedad B"]).toBe(
      1_500_000 * 0.8,
    );
  });

  it("ventas-de-lotes-a-plazos: cuota, atraso, estados y amortización", async () => {
    const { wb, ev } = await buildExample("ventas-de-lotes-a-plazos");
    const p1 = Math.round(pmt(240000 - 24000, 0.01, 60) * 100) / 100;
    const p2 = Math.round(pmt(360000 - 36000, 0.01, 60) * 100) / 100;
    expect(tableRow(wb, ev, "Contratos", "Contrato", "V-001")).toMatchObject({
      Precio: 240000,
      Financiado: 216000,
      "Cuota mensual": p1,
      "Cuotas vencidas": 3,
      "Cuotas pagadas": 3,
      Atraso: 0,
      Estado: "Al día",
    });
    const v2 = tableRow(wb, ev, "Contratos", "Contrato", "V-002");
    expect(v2).toMatchObject({ "Cuotas vencidas": 4, Estado: "Atrasado" });
    expect(v2.Atraso).toBeCloseTo(3 * p2, 2);
    expect(tableRow(wb, ev, "Contratos", "Contrato", "V-003")).toMatchObject({
      Atraso: 0,
      Estado: "Al día",
    });
    expect(tableRow(wb, ev, "Lotes", "Lote", "A-01")).toMatchObject({
      Estado: "Vendido",
      Cliente: "Wilmer Antonio Cruz",
    });
    expect(tableRow(wb, ev, "Lotes", "Lote", "A-03").Estado).toBe("Reservado");
    expect(tableRow(wb, ev, "Lotes", "Lote", "B-02").Estado).toBe("Disponible");
    expect(valueRightOf(wb, ev, "Resumen", "Lotes vendidos")).toBe(3);
    expect(valueRightOf(wb, ev, "Resumen", "Contratos atrasados")).toBe(1);
    expect(columnBelow(wb, ev, "Estado de cuenta", "Interés", 1)[0]).toBe(3240);
    expect(columnBelow(wb, ev, "Estado de cuenta", "Estado", 3)).toEqual([
      "Pagada",
      "Vencida",
      "Vencida",
    ]);
  });

  it("asistencia-escolar: conteos, porcentaje por alumno y resumen anual", async () => {
    const { wb, ev } = await buildExample("asistencia-escolar");
    expect(tableRow(wb, ev, "Febrero", "Alumno", "Luis Fernando Reyes")).toMatchObject({
      Asistió: 6,
      Ausencias: 4,
      "Días registrados": 10,
      "% asistencia": 0.6,
    });
    expect(tableRow(wb, ev, "Febrero", "Alumno", "Carlos Eduardo López")).toMatchObject({
      Asistió: 9,
      Tardanzas: 1,
      Justificadas: 1,
      "% asistencia": 0.9,
    });
    expect(tableRow(wb, ev, "Febrero", "Alumno", "Presentes del día")).toBeDefined();
    expect(tableRow(wb, ev, "Resumen", "Alumno", "Luis Fernando Reyes")).toMatchObject({
      "Ausencias del año": 4,
      "% del año": 0.6,
      Situación: "En riesgo",
    });
    expect(tableRow(wb, ev, "Resumen", "Alumno", "Ana Sofía Martínez")).toMatchObject({
      "% del año": 1,
      Situación: "Bien",
    });
    expect(valueRightOf(wb, ev, "Resumen", "Alumnos en riesgo")).toBe(1);
  });

  it("horario-de-clases: horas con recreo y carga por materia y docente", async () => {
    const { wb, ev } = await buildExample("horario-de-clases");
    const subjects = [
      "Español",
      "Matemáticas",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Inglés",
      "Educación Física",
      "Educación Artística",
      "Computación",
      "Formación Ciudadana",
    ];
    const count = new Map<string, number>();
    for (let p = 1; p <= 7; p++)
      for (let d = 0; d < 5; d++)
        count.set(subjects[(p + d * 2) % 9]!, (count.get(subjects[(p + d * 2) % 9]!) ?? 0) + 1);
    const times = columnBelow(wb, ev, "1.º grado", "Hora", 5);
    expect(times[0]).toBe("7:00 - 7:45");
    expect(times[4]).toBe("9:45 - 10:30");
    expect(tableRow(wb, ev, "Materias", "Materia", "Matemáticas")).toMatchObject({
      "Periodos por semana": count.get("Matemáticas"),
      "Horas por semana": (count.get("Matemáticas")! * 45) / 60,
    });
    const zavala = [0, 3, 6].reduce((acc, i) => acc + (count.get(subjects[i]!) ?? 0), 0);
    expect(tableRow(wb, ev, "Materias", "Nombre del docente", "Prof. Zavala")).toMatchObject({
      "Materias que imparte": 3,
      "Periodos por semana": zavala,
    });
  });

  it("planificador-de-estudio: avance semanal, horario y entregas atrasadas", async () => {
    const { wb, ev } = await buildExample("planificador-de-estudio");
    const subjects = ["Matemáticas", "Español", "Química", "Historia de Honduras", "Inglés"];
    let planned = 0;
    for (const h of [15, 16, 19])
      for (let d = 0; d < 5; d++) if (subjects[(d + h) % 5] === "Matemáticas") planned++;
    expect(tableRow(wb, ev, "Materias", "Materia", "Matemáticas")).toMatchObject({
      "Planificadas en el horario": planned,
      "Estudiadas esta semana": 1,
      "Avance de la meta": 0.25,
      "Horas en total": 2.5,
      Pendientes: 1,
    });
    expect(valueRightOf(wb, ev, "Materias", "Horas estudiadas esta semana")).toBe(1.75);
    expect(valueRightOf(wb, ev, "Materias", "Entregas atrasadas")).toBe(1);
  });

  it("pagos-de-academias: cuota con beca, morosos y resultado", async () => {
    const { wb, ev } = await buildExample("pagos-de-academias");
    expect(tableRow(wb, ev, "Alumnos y pagos", "Alumno", "Diego Núñez")).toMatchObject({
      Cuota: 600,
      Inscripción: 500,
      "Total pagado": 2300,
      Estado: "Al día",
    });
    expect(tableRow(wb, ev, "Alumnos y pagos", "Alumno", "Valeria Turcios")).toMatchObject({
      "Saldo pendiente": 2000,
      Estado: "Moroso",
    });
    expect(tableRow(wb, ev, "Resumen", "Curso", "Inglés básico")).toMatchObject({
      Alumnos: 2,
      Cobrado: 6400,
      Pendiente: 0,
      Morosos: 0,
    });
    expect(tableRow(wb, ev, "Resumen", "Curso", "Guitarra")).toMatchObject({
      Alumnos: 1,
      Pendiente: 2000,
      Morosos: 1,
    });
    expect(tableRow(wb, ev, "Resumen", "Mes", "Enero")).toMatchObject({
      Mensualidades: 2800,
      "Materiales y eventos": 200,
      Gastos: 2500,
      Resultado: 500,
    });
    expect(valueRightOf(wb, ev, "Resumen", "Inscripciones cobradas")).toBe(1300);
    expect(valueRightOf(wb, ev, "Resumen", "Resultado del año (con inscripciones)")).toBe(5400);
  });

  it("citas-y-pacientes: edad, saldos, agenda del día y profesionales", async () => {
    const { wb, ev } = await buildExample("citas-y-pacientes");
    const now = new Date();
    const age =
      now.getUTCFullYear() -
      1985 -
      (now.getUTCMonth() < 2 || (now.getUTCMonth() === 2 && now.getUTCDate() < 14) ? 1 : 0);
    expect(tableRow(wb, ev, "Pacientes", "Código", "PAC-001")).toMatchObject({
      Edad: age,
      "Citas atendidas": 1,
    });
    expect(valueRightOf(wb, ev, "Agenda del día", "Citas del día")).toBe(2);
    expect(columnBelow(wb, ev, "Agenda del día", "Paciente", 3)).toEqual([
      "José Luis Andino",
      "María Elena Rodríguez",
      "",
    ]);
    expect(tableRow(wb, ev, "Resumen", "Profesional", "Dr. Castro")).toMatchObject({
      Atendidas: 1,
      Ingresos: 600,
      "Por cobrar": 600,
    });
    expect(valueRightOf(wb, ev, "Resumen", "Saldo por cobrar")).toBe(600);
  });

  it("historial-de-consultas: IMC, estado del control y ficha del paciente", async () => {
    const { wb, ev } = await buildExample("historial-de-consultas");
    expect(columnBelow(wb, ev, "Consultas", "IMC", 3)).toEqual([30, 29.4, 26.7]);
    expect(columnBelow(wb, ev, "Consultas", "Estado del control", 3)).toEqual([
      "Atendido",
      "Programado",
      "Programado",
    ]);
    expect(valueRightOf(wb, ev, "Ficha del paciente", "Consultas registradas")).toBe(2);
    expect(valueRightOf(wb, ev, "Ficha del paciente", "Próximo control")).toBe(
      serial(isoFromToday(5)),
    );
    expect(valueRightOf(wb, ev, "Ficha del paciente", "Alergias")).toBe("Penicilina");
    expect(columnBelow(wb, ev, "Ficha del paciente", "Presión", 3)).toEqual([
      "132/84",
      "150/95",
      "",
    ]);
    expect(valueRightOf(wb, ev, "Resumen", "Controles en los próximos 7 días")).toBe(2);
    expect(valueRightOf(wb, ev, "Resumen", "Controles vencidos sin nueva consulta")).toBe(0);
  });

  it("medicamentos-y-vencimientos: horarios, días que alcanza y alertas", async () => {
    const { wb, ev } = await buildExample("medicamentos-y-vencimientos");
    expect(tableRow(wb, ev, "Medicamentos", "Medicamento", "Metformina")).toMatchObject({
      "Tomas al día": 2,
      Horarios: "7:00  ·  19:00",
      "Días que alcanza": 4,
      Estado: "Comprar",
    });
    expect(tableRow(wb, ev, "Medicamentos", "Medicamento", "Acetaminofén")).toMatchObject({
      "Unidades al día": 6,
      "Días que alcanza": 5,
      Estado: "Por vencer",
    });
    expect(tableRow(wb, ev, "Medicamentos", "Medicamento", "Losartán").Estado).toBe("Bien");
    expect(tableRow(wb, ev, "Medicamentos", "Medicamento", "Salbutamol").Estado).toBe("Vencido");
    expect(valueRightOf(wb, ev, "Resumen", "Por comprar")).toBe(1);
    expect(tableRow(wb, ev, "Resumen", "Persona", "Papá")).toMatchObject({
      Medicamentos: 2,
      "Con alerta": 2,
    });
    expect(tableRow(wb, ev, "Compras", "Medicamento", "Losartán")["Precio por unidad"]).toBe(15);
  });

  it("seguimiento-de-salud: clasificación de presión, glucosa e IMC y promedios", async () => {
    const { wb, ev } = await buildExample("seguimiento-de-salud");
    expect(columnBelow(wb, ev, "Mediciones", "Presión", 3)).toEqual([
      "Hipertensión 2",
      "Hipertensión 1",
      "Normal",
    ]);
    expect(columnBelow(wb, ev, "Mediciones", "Glucosa", 3)).toEqual([
      "Prediabetes",
      "Elevada",
      "Normal",
    ]);
    expect(columnBelow(wb, ev, "Mediciones", "IMC", 3)).toEqual([30.5, "", 29.8]);
    expect(columnBelow(wb, ev, "Mediciones", "Peso según IMC", 3)).toEqual([
      "Obesidad",
      "",
      "Sobrepeso",
    ]);
    expect(columnBelow(wb, ev, "Mediciones", "Alerta", 3)).toEqual(["Sí", "", ""]);
    expect(tableRow(wb, ev, "Resumen", "Persona", "Yo")).toMatchObject({
      "Sistólica (30 días)": 129,
      "Diastólica (30 días)": 83,
      "Glucosa en ayunas (30 días)": 107,
      "Alertas (30 días)": 1,
    });
  });

  it("planificador-de-comidas-y-rutinas: costo de platillos, lista de compras y rutina", async () => {
    const { wb, ev } = await buildExample("planificador-de-comidas-y-rutinas");
    expect(tableRow(wb, ev, "Platillos", "Platillo", "Baleadas con huevo")).toMatchObject({
      "Costo por preparación": 91,
      "Veces en el menú": 4,
      "Costo en la semana": 364,
    });
    expect(
      tableRow(wb, ev, "Lista de compras", "Ingrediente", "Tortillas de harina"),
    ).toMatchObject({ Necesitas: 88, Comprar: 88, "Costo estimado": 352 });
    expect(tableRow(wb, ev, "Lista de compras", "Ingrediente", "Huevos")).toMatchObject({
      Necesitas: 16,
      Comprar: 10,
      "Costo estimado": 45,
    });
    expect(tableRow(wb, ev, "Lista de compras", "Ingrediente", "Frijoles rojos")).toMatchObject({
      Necesitas: 9,
      Comprar: 8,
    });
    expect(valueRightOf(wb, ev, "Rutina", "Planificado vs. meta")).toBe(1);
    expect(valueRightOf(wb, ev, "Rutina", "Cumplido vs. meta")).toBeCloseTo(80 / 150, 6);
    expect(tableRow(wb, ev, "Rutina", "Tipo de actividad", "Fuerza")).toMatchObject({
      "Minutos planificados": 60,
      "Minutos cumplidos": 20,
    });
  });

  it("plan-de-negocio-12-meses: ventas, préstamo, flujo de caja e indicadores", async () => {
    const { wb, ev } = await buildExample("plan-de-negocio-12-meses");
    const products = [
      [35, 10, 900, 0.03],
      [30, 12, 1200, 0.02],
      [45, 18, 400, 0.04],
    ];
    const r = 0.18 / 12;
    const payment = pmt(100000, r, 24);
    const dep = 160000 / 60;
    let balance = 100000;
    let cash = 75000;
    let salesYear = 0;
    let netYear = 0;
    let minCash = Infinity;
    let firstProfit = 0;
    for (let m = 0; m < 12; m++) {
      let sales = 0;
      let cost = 0;
      for (const [price, unitCost, units, growth] of products) {
        const u = Math.round(units! * Math.pow(1 + growth!, m));
        sales += u * price!;
        cost += u * unitCost!;
      }
      const fixed = 51400 + (m >= 3 ? 9000 : 0);
      const interest = Math.round(balance * r * 100) / 100;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      const ebit = sales - cost - fixed - dep;
      const net = ebit - interest;
      if (!firstProfit && ebit > 0) firstProfit = m + 1;
      cash += net + dep - principal;
      minCash = Math.min(minCash, cash);
      salesYear += sales;
      netYear += net;
    }
    expect(valueRightOf(wb, ev, "Supuestos", "Efectivo al iniciar operaciones")).toBe(75000);
    expect(valueRightOf(wb, ev, "Indicadores", "Ventas del año")).toBe(salesYear);
    expect(valueRightOf(wb, ev, "Indicadores", "Utilidad neta del año")).toBeCloseTo(netYear, 2);
    expect(valueRightOf(wb, ev, "Indicadores", "Efectivo al final del año")).toBeCloseTo(cash, 2);
    expect(valueRightOf(wb, ev, "Indicadores", "Efectivo más bajo del año")).toBeCloseTo(
      minCash,
      2,
    );
    expect(valueRightOf(wb, ev, "Indicadores", "Saldo del préstamo al cierre")).toBeCloseTo(
      balance,
      2,
    );
    expect(valueRightOf(wb, ev, "Indicadores", "Primer mes con utilidad de operación")).toBe(
      firstProfit ? `Mes ${firstProfit}` : "No se alcanza en el año",
    );
  });

  it("costos-de-producto: costo unitario, precio sugerido con ISV y margen real", async () => {
    const { wb, ev } = await buildExample("costos-de-producto");
    const isv = HN.taxes.salesTax.rates.find((x) => x.id === "standard")!.rate;
    const pan = tableRow(wb, ev, "Productos", "Producto", "Pan de coco (bolsa de 6)");
    expect(pan).toMatchObject({ "Materiales del lote": 419.5, "Mano de obra del lote": 180 });
    expect(pan["Costo por unidad"]).toBeCloseTo(37.975, 6);
    expect(pan["Precio sugerido"]).toBeCloseTo(37.975 / 0.6, 6);
    expect(pan["Margen real"]).toBeCloseTo((60 - 37.975) / 60, 6);
    const pastel = tableRow(wb, ev, "Productos", "Producto", "Pastel tres leches (porción)");
    expect(pastel["Costo por unidad"]).toBeCloseTo(38.125, 6);
    expect(pastel["Sugerido con ISV"]).toBeCloseTo((38.125 / 0.6) * (1 + isv), 6);
    const net = 70 / (1 + isv);
    expect(pastel["Margen real"]).toBeCloseTo((net - 38.125) / net, 6);
    expect(valueRightOf(wb, ev, "Gastos indirectos", "Gasto indirecto por unidad")).toBe(6);
  });

  it("calendario-de-contenido: día de la semana, tasa de interacción y resultados", async () => {
    const { wb, ev } = await buildExample("calendario-de-contenido");
    const rows = columnBelow(wb, ev, "Publicaciones", "Tasa de interacción", 2);
    expect(rows[0]).toBeCloseTo(240 / 3200, 8);
    const day = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][
      new Date(`${isoFromToday(-6)}T12:00:00Z`).getUTCDay()
    ];
    expect(columnBelow(wb, ev, "Publicaciones", "Día", 1)[0]).toBe(day);
    const fb = tableRow(wb, ev, "Resultados", "Red", "Facebook");
    expect(fb).toMatchObject({ Publicadas: 1, Alcance: 3200, Interacciones: 240, Mensajes: 18 });
    expect(fb["Tasa de interacción"]).toBeCloseTo(0.075, 8);
    expect(tableRow(wb, ev, "Resultados", "Tema", "Promoción")).toMatchObject({
      Planificadas: 2,
      Publicadas: 1,
    });
  });

  it("campanas-y-resultados: métricas por campaña, ROAS y ganancia", async () => {
    const { wb, ev } = await buildExample("campanas-y-resultados");
    const promo = tableRow(wb, ev, "Campañas", "Campaña", "Promo Día del Padre");
    expect(promo).toMatchObject({
      Invertido: 3000,
      "% del presupuesto": 0.75,
      Clics: 1160,
      "Costo por venta": 120,
      Ingresos: 30000,
      "ROAS (ingresos ÷ inversión)": 10,
      "Ganancia después de publicidad": 9000,
    });
    expect(promo.CTR).toBeCloseTo(1160 / 81000, 8);
    expect(promo["Costo por clic"]).toBeCloseTo(3000 / 1160, 8);
    expect(tableRow(wb, ev, "Campañas", "Campaña", "Volanteo colonia")).toMatchObject({
      CTR: "",
      "Costo por clic": "",
      "Ganancia después de publicidad": 600,
    });
    expect(valueRightOf(wb, ev, "Resumen", "ROAS total")).toBeCloseTo(35400 / 4400, 8);
    expect(valueRightOf(wb, ev, "Resumen", "Ganancia después de publicidad")).toBe(9760);
    expect(tableRow(wb, ev, "Resumen", "Plataforma", "Facebook e Instagram")).toMatchObject({
      Invertido: 3000,
      ROAS: 10,
    });
  });

  it("crm-simple: probabilidad, último contacto, alertas y embudo", async () => {
    const { wb, ev } = await buildExample("crm-simple");
    expect(tableRow(wb, ev, "Clientes", "Nombre", "Ana Gabriela Matute")).toMatchObject({
      Probabilidad: 0.4,
      "Valor ponderado": 9600,
      "Último contacto": serial(isoFromToday(-12)),
      Contactos: 2,
      Alerta: "Acción atrasada",
    });
    expect(tableRow(wb, ev, "Clientes", "Nombre", "Transportes Rápidos S. de R.L.")).toMatchObject({
      "Último contacto": serial(isoFromToday(-3)),
      Alerta: "",
    });
    expect(tableRow(wb, ev, "Clientes", "Nombre", "María Fernanda Cálix")).toMatchObject({
      "Último contacto": "",
      Alerta: "",
    });
    expect(tableRow(wb, ev, "Embudo", "Etapa de venta", "Cotizado")).toMatchObject({
      Clientes: 1,
      Valor: 24000,
      "Valor ponderado": 9600,
    });
    expect(tableRow(wb, ev, "Embudo", "Origen", "Facebook")).toMatchObject({
      Clientes: 1,
      Ganados: 1,
      Conversión: 1,
      Vendido: 12000,
    });
    expect(valueRightOf(wb, ev, "Embudo", "Valor ponderado en proceso")).toBe(64400);
    expect(valueRightOf(wb, ev, "Embudo", "Clientes con alerta")).toBe(1);
  });

  it("metas-de-ventas: ventas reales y cumplimiento por mes", async () => {
    const { wb, ev } = await buildExample("metas-de-ventas");
    expect(tableRow(wb, ev, "Cumplimiento", "Ventas reales", "María")).toMatchObject({
      Ene: 55000,
      Feb: 42000,
      "Total del año": 97000,
    });
    const pct = tableRow(wb, ev, "Cumplimiento", "% de la meta", "María");
    expect(pct).toMatchObject({ Ene: 1.1, Feb: 0.84 });
    expect(pct["Año"]).toBeCloseTo(97000 / 600000, 8);
    expect(tableRow(wb, ev, "Cumplimiento", "% de la meta", "Carlos").Ene).toBe(0.7);
    expect(tableRow(wb, ev, "Metas", "Vendedor", "Tienda en línea")["Meta del año"]).toBe(600000);
    expect(tableRow(wb, ev, "Este mes", "Vendedor", "María")["Meta del mes"]).toBe(50000);
  });

  it("plan-de-lanzamiento: fechas desde el lanzamiento, avance y presupuesto", async () => {
    const { wb, ev } = await buildExample("plan-de-lanzamiento");
    expect(valueRightOf(wb, ev, "Plan", "Días para el lanzamiento")).toBe(45);
    expect(
      tableRow(wb, ev, "Plan", "Tarea", "Definir el producto, el cliente ideal y el precio"),
    ).toMatchObject({
      Inicio: serial(isoFromToday(0)),
      Fin: serial(isoFromToday(4)),
      Estado: "Hecho",
      Alerta: "",
    });
    expect(tableRow(wb, ev, "Plan", "Tarea", "Pedir reseñas y testimonios").Inicio).toBe(
      serial(isoFromToday(52)),
    );
    expect(tableRow(wb, ev, "Resumen", "Fase", "Preparación")).toMatchObject({
      Tareas: 6,
      Hechas: 5,
      Presupuesto: 9500,
      "Gasto real": 5850,
    });
    expect(valueRightOf(wb, ev, "Resumen", "Avance total")).toBeCloseTo(5 / 21, 8);
    expect(valueRightOf(wb, ev, "Resumen", "Presupuesto disponible")).toBe(34000 - 5850);
  });
});
