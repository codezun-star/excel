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
});
