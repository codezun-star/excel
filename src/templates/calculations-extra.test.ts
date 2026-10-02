import type ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

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
});
