import { describe, expect, it } from "vitest";

import { buildExample, tableRow, valueRightOf } from "@/test/template-helpers";

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
});
