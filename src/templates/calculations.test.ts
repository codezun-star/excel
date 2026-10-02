import { describe, expect, it } from "vitest";

import { buildExample, tableRow, valueRightOf } from "@/test/template-helpers";

describe("cálculos de plantillas con datos de ejemplo", () => {
  it("reporte-de-ventas: total anual y enero", async () => {
    const { wb, ev } = await buildExample("reporte-de-ventas");
    expect(valueRightOf(wb, ev, "Resumen", "Ventas del año")).toBe(2076);
    expect(valueRightOf(wb, ev, "Resumen", "Enero")).toBe(536);
  });

  it("caja-diaria-arqueo: efectivo esperado y faltante", async () => {
    const { wb, ev } = await buildExample("caja-diaria-arqueo");
    expect(valueRightOf(wb, ev, "Caja", "Efectivo esperado en caja")).toBe(3230);
    expect(valueRightOf(wb, ev, "Arqueo", "Total contado", 1)).toBe(2120);
    expect(valueRightOf(wb, ev, "Arqueo", "Diferencia")).toBe(-1110);
    expect(valueRightOf(wb, ev, "Arqueo", "Resultado")).toBe("Faltante");
  });

  it("cuentas-por-cobrar-pagar: saldos, estados y antigüedad", async () => {
    const { wb, ev } = await buildExample("cuentas-por-cobrar-pagar");
    expect(valueRightOf(wb, ev, "Antigüedad", "Al día (sin vencer)")).toBe(1250);
    expect(valueRightOf(wb, ev, "Antigüedad", "31 a 60 días")).toBe(3000);
    expect(valueRightOf(wb, ev, "Antigüedad", "Total pendiente")).toBe(4250);
  });

  it("estado-de-cuenta-cliente: saldo final", async () => {
    const { wb, ev } = await buildExample("estado-de-cuenta-cliente");
    expect(valueRightOf(wb, ev, "Estado de cuenta", "SALDO FINAL")).toBe(2650);
  });

  it("recibo-de-pago: registro y cantidad en letras", async () => {
    const { wb, ev } = await buildExample("recibo-de-pago");
    expect(valueRightOf(wb, ev, "Registro", "Total recibido")).toBeCloseTo(14350.5, 2);
    expect(valueRightOf(wb, ev, "Recibos", "La cantidad de:")).toBe(
      "MIL OCHOCIENTOS CINCUENTA LEMPIRAS CON 00/100",
    );
  });

  it("libro-de-ventas-y-compras: débito, crédito e ISV a pagar", async () => {
    const { wb, ev } = await buildExample("libro-de-ventas-y-compras");
    expect(valueRightOf(wb, ev, "Resumen ISV", "Total débito fiscal")).toBeCloseTo(2031, 2);
    expect(valueRightOf(wb, ev, "Resumen ISV", "Total crédito fiscal")).toBeCloseTo(1248, 2);
    expect(valueRightOf(wb, ev, "Resumen ISV", "ISV a pagar")).toBeCloseTo(783, 2);
  });

  it("ventas-por-vendedor-comisiones: comisión escalonada", async () => {
    const { wb, ev } = await buildExample("ventas-por-vendedor-comisiones");
    // Ana: 67 000 ≥ 60 000 → 5 % = 3 350; Carlos: 18 000 → 3 % = 540; Lucía: 30 500 → 3 % = 915
    expect(valueRightOf(wb, ev, "Comisiones", "Totales")).toBe(180000);
    const ws = wb.getWorksheet("Comisiones")!;
    let total: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Totales")
          total = ev.value("Comisiones", ws.getCell(Number(c.row), 6).address);
      }),
    );
    expect(total).toBeCloseTo(4805, 2);
  });

  it("planilla-de-sueldos: IHSS con techo, RAP sobre excedente e ISR por tramos", async () => {
    const { wb, ev } = await buildExample("planilla-de-sueldos");
    const maria = tableRow(wb, ev, "Planilla", "Empleado", "María José Flores");
    expect(maria["Total devengado"]).toBe(14000);
    expect(maria["IHSS Enfermedad y Maternidad"]).toBeCloseTo(297.58, 2);
    expect(maria["IHSS Invalidez, Vejez y Muerte"]).toBeCloseTo(297.58, 2);
    expect(maria["RAP (aportación sobre excedente del techo IHSS)"]).toBeCloseTo(31.45, 2);
    expect(maria["Retención ISR"]).toBe(0);
    expect(maria["Neto a pagar"]).toBeCloseTo(13373.39, 2);

    const jose = tableRow(wb, ev, "Planilla", "Empleado", "José Ramón Castillo");
    expect(jose["Renta neta anual estimada"]).toBe(980000);
    expect(jose["Retención ISR"]).toBeCloseTo(12738.38, 2);
    expect(jose["Neto a pagar"]).toBeCloseTo(70570.01, 2);
  });

  it("decimo-tercer-y-cuarto-mes: completos y proporcionales (base 360)", async () => {
    const { wb, ev } = await buildExample("decimo-tercer-y-cuarto-mes");
    const carlos = tableRow(wb, ev, "Décimos", "Empleado", "Carlos Antonio Reyes");
    expect(carlos["Décimo tercer mes (aguinaldo)"]).toBeCloseTo(11400, 2);
    expect(carlos["Décimo cuarto mes"]).toBeCloseTo(3800, 2);
    const jose = tableRow(wb, ev, "Décimos", "Empleado", "José Ramón Castillo");
    expect(jose["Décimo tercer mes (aguinaldo)"]).toBeCloseTo(21250, 2);
    expect(jose["Décimo cuarto mes"]).toBeCloseTo(63750, 2);
    expect(valueRightOf(wb, ev, "Décimos", "Totales")).toBeTruthy();
    const ws = wb.getWorksheet("Décimos")!;
    let total: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Totales")
          total = ev.value("Décimos", ws.getCell(Number(c.row), ws.columnCount).address);
      }),
    );
    expect(total).toBeCloseTo(193700, 2);
  });

  it("prestaciones-laborales: preaviso, cesantía, vacaciones y décimos", async () => {
    const { wb, ev } = await buildExample("prestaciones-laborales");
    const v = (label: string) => valueRightOf(wb, ev, "Prestaciones", label);
    expect(v("Tiempo de servicio (días, base 360)")).toBe(1906);
    expect(v("Preaviso")).toBeCloseTo(37000, 2);
    expect(v("Auxilio de cesantía")).toBeCloseTo(97947.22, 2);
    expect(v("Vacaciones proporcionales")).toBeCloseTo(3533.33, 2);
    expect(v("Décimo tercer mes (aguinaldo) proporcional")).toBeCloseTo(9000, 2);
    expect(v("Décimo cuarto mes proporcional")).toBeCloseTo(18000, 2);
    expect(v("TOTAL A PAGAR")).toBeCloseTo(177480.55, 2);
  });

  it("horas-extra: valor hora por jornada y recargos", async () => {
    const { wb, ev } = await buildExample("horas-extra");
    expect(valueRightOf(wb, ev, "Resumen", "Total a pagar")).toBeCloseTo(650, 2);
  });

  it("salario-minimo: verificador contra la tabla", async () => {
    const { wb, ev } = await buildExample("salario-minimo");
    expect(tableRow(wb, ev, "Verificador", "Empleado", "Pedro Gómez")["¿Cumple?"]).toBe("Sí");
    const lucia = tableRow(wb, ev, "Verificador", "Empleado", "Lucía Paz");
    expect(lucia["Salario mínimo"]).toBeCloseTo(13527.23, 2);
    expect(lucia["¿Cumple?"]).toBe("No");
    expect(tableRow(wb, ev, "Verificador", "Empleado", "Mario Ruiz")["¿Cumple?"]).toBe("Sí");
  });

  it("control-de-vacaciones: días ganados, tomados y pendientes", async () => {
    const { wb, ev } = await buildExample("control-de-vacaciones");
    const maria = tableRow(wb, ev, "Saldos", "Empleado", "María José Flores");
    expect(Number(maria["Años cumplidos"])).toBeGreaterThanOrEqual(7);
    expect(maria["Días tomados"]).toBe(10);
    expect(Number(maria["Días pendientes"])).toBe(Number(maria["Días ganados"]) - 10);
  });

  it("control-de-asistencia: conteos por código", async () => {
    const { wb, ev } = await buildExample("control-de-asistencia");
    const row = tableRow(wb, ev, "Asistencia", "Empleado", "Empleado 2");
    expect(row["A"]).toBe(1);
    expect(row["T"]).toBe(1);
    expect(row["F"]).toBe(2);
    expect(row["% asistencia"]).toBeCloseTo(7 / 8, 4);
  });

  it("horarios-y-turnos: horas netas y exceso con turno nocturno", async () => {
    const { wb, ev } = await buildExample("horarios-y-turnos");
    // 5 días de 9 h + sábado de 4 h − 1 h de descanso por día (6 días) = 43 h
    expect(tableRow(wb, ev, "Horario", "Empleado", "Empleado 1")["Horas netas"]).toBeCloseTo(43, 4);
    // Turno nocturno 22:00–04:00 × 5 días − 5 h de descanso = 25 h (máximo 36)
    const night = tableRow(wb, ev, "Horario", "Empleado", "Empleado 3");
    expect(night["Horas netas"]).toBeCloseTo(25, 4);
    expect(night["Exceso"]).toBe(0);
  });

  it("boleta-de-pago: neto igual a la planilla", async () => {
    const { wb, ev } = await buildExample("boleta-de-pago");
    expect(tableRow(wb, ev, "Datos", "Empleado", "María José Flores")["Neto a pagar"]).toBeCloseTo(
      12880.89,
      2,
    );
  });

  it("declaracion-mensual-isv: débito, crédito e ISV a pagar", async () => {
    const { wb, ev } = await buildExample("declaracion-mensual-isv");
    const v = (l: string) => valueRightOf(wb, ev, "Declaración ISV", l);
    expect(v("Total débito fiscal")).toBeCloseTo(34860, 2);
    expect(v("Total crédito fiscal")).toBeCloseTo(22680, 2);
    expect(v("ISV A PAGAR")).toBeCloseTo(10080, 2);
  });

  it("isr-personas-naturales: impuesto anual por tramos", async () => {
    const { wb, ev } = await buildExample("isr-personas-naturales");
    const v = (l: string) => valueRightOf(wb, ev, "Cálculo ISR", l);
    // Renta neta = 620 000 − 40 000 exentos − 40 000 gastos médicos = 540 000
    expect(v("Renta neta gravable")).toBe(540000);
    // 15 % × 119 829.78 + 20 % × (540 000 − 348 154.10) = 17 974.47 + 38 369.18
    expect(v("Impuesto anual según tabla progresiva")).toBeCloseTo(56343.65, 2);
    expect(v("IMPUESTO A PAGAR")).toBeCloseTo(52843.65, 2);
  });

  it("flujo-de-caja: saldo final acumulado de 12 meses", async () => {
    const { wb, ev } = await buildExample("flujo-de-caja");
    // Neto mensual = 75 000 − 64 500 = 10 500; saldo final = 25 000 + 12 × 10 500
    expect(valueRightOf(wb, ev, "Flujo de caja", "Saldo final")).toBe(35500);
    const ws = wb.getWorksheet("Flujo de caja")!;
    let total: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Saldo final")
          total = ev.value("Flujo de caja", ws.getCell(Number(c.row), 14).address);
      }),
    );
    expect(total).toBe(151000);
  });

  it("conciliacion-bancaria: saldos conciliados", async () => {
    const { wb, ev } = await buildExample("conciliacion-bancaria");
    expect(valueRightOf(wb, ev, "Conciliación", "Saldo del banco conciliado")).toBe(146230);
    expect(valueRightOf(wb, ev, "Conciliación", "Estado")).toBe("Conciliado");
  });

  it("punto-de-equilibrio: unidades y ventas", async () => {
    const { wb, ev } = await buildExample("punto-de-equilibrio");
    // Costos fijos 40 000; margen 50 → 800 unidades; 96 000 en ventas
    expect(
      valueRightOf(wb, ev, "Punto de equilibrio", "Punto de equilibrio (unidades al mes)"),
    ).toBe(800);
    expect(
      valueRightOf(wb, ev, "Punto de equilibrio", "Punto de equilibrio (ventas al mes)"),
    ).toBeCloseTo(96000, 2);
    expect(valueRightOf(wb, ev, "Punto de equilibrio", "Unidades para la utilidad deseada")).toBe(
      1200,
    );
  });

  it("catalogo-de-cuentas: tipo y naturaleza desde el código", async () => {
    const { wb, ev } = await buildExample("catalogo-de-cuentas");
    const row = tableRow(wb, ev, "Catálogo", "Código", "2103");
    expect(row["Tipo"]).toBe("Pasivo");
    expect(row["Naturaleza"]).toBe("Acreedora");
    expect(row["Nivel"]).toBe(3);
  });

  it("libro-diario-mayor: partidas cuadradas y saldos del mayor", async () => {
    const { wb, ev } = await buildExample("libro-diario-mayor");
    expect(valueRightOf(wb, ev, "Mayor y balanza", "Balanza")).toBe("Cuadrada");
    const bancos = tableRow(wb, ev, "Mayor y balanza", "Código", "1103");
    expect(bancos["Saldo deudor"]).toBe(54000);
    const ventas = tableRow(wb, ev, "Mayor y balanza", "Código", "4101");
    expect(ventas["Saldo acreedor"]).toBe(30000);
  });

  it("activos-fijos-depreciacion: acumulada y valor en libros", async () => {
    const { wb, ev } = await buildExample("activos-fijos-depreciacion");
    // Pickup: (720 000 − 120 000) / 5 años / 12 = 10 000 al mes; jun año−2 → dic año = 30 meses
    const pickup = tableRow(wb, ev, "Activos", "Código", "VEH-01");
    expect(pickup["Meses depreciados"]).toBe(30);
    expect(pickup["Depreciación acumulada"]).toBe(300000);
    expect(pickup["Valor en libros"]).toBe(420000);
  });

  it("estado-de-resultados-balance: utilidad neta y balance cuadrado", async () => {
    const { wb, ev } = await buildExample("estado-de-resultados-balance");
    expect(valueRightOf(wb, ev, "Estado de resultados", "UTILIDAD NETA")).toBe(184000);
    expect(valueRightOf(wb, ev, "Balance general", "TOTAL ACTIVO")).toBe(1102000);
    expect(valueRightOf(wb, ev, "Balance general", "Diferencia (debe ser cero)")).toBe(0);
  });

  it("presupuesto-anual: real del mes desde los movimientos", async () => {
    const { wb, ev } = await buildExample("presupuesto-anual");
    expect(valueRightOf(wb, ev, "Comparación", "Total ingresos reales")).toBe(112000);
    expect(valueRightOf(wb, ev, "Comparación", "Total gastos reales")).toBe(81000);
  });

  it("simulador-de-prestamos: cuota nivelada y saldo cero al final", async () => {
    const { wb, ev } = await buildExample("simulador-de-prestamos", { example: false });
    // 150 000 al 18 % anual, 36 meses → cuota 5 422.86
    expect(valueRightOf(wb, ev, "Préstamo", "Cuota mensual (capital + interés)")).toBeCloseTo(
      5422.86,
      2,
    );
    const interest = Number(valueRightOf(wb, ev, "Préstamo", "Total de intereses"));
    expect(valueRightOf(wb, ev, "Préstamo", "Número de cuotas pagadas")).toBe(36);
    // El capital pagado suma exactamente el monto prestado
    expect(
      Number(valueRightOf(wb, ev, "Préstamo", "Total pagado (capital + intereses)")) - interest,
    ).toBeCloseTo(150000, 2);
    expect(interest).toBeGreaterThan(45000);
    expect(interest).toBeLessThan(45300);
  });

  it("simulador-de-prestamos: el abono extra reduce cuotas", async () => {
    const { wb, ev } = await buildExample("simulador-de-prestamos");
    expect(Number(valueRightOf(wb, ev, "Préstamo", "Número de cuotas pagadas"))).toBeLessThan(36);
  });

  it("inventario-stock-minimo: existencias y estados", async () => {
    const { wb, ev } = await buildExample("inventario-stock-minimo");
    const arroz = tableRow(wb, ev, "Inventario", "Código", "P001");
    expect(arroz["Existencia"]).toBe(16);
    expect(arroz["Estado"]).toBe("OK");
    const gaseosa = tableRow(wb, ev, "Inventario", "Código", "P002");
    expect(gaseosa["Existencia"]).toBe(20);
    expect(gaseosa["Estado"]).toBe("Reordenar");
    expect(tableRow(wb, ev, "Inventario", "Código", "P003")["Estado"]).toBe("Agotado");
  });

  it("kardex: costo promedio ponderado", async () => {
    const { wb, ev } = await buildExample("kardex");
    const ws = wb.getWorksheet("Kardex")!;
    // 50 × 40 + 100 × 43 = 6 300 / 150 = 42; salen 80 a 42 = 3 360; quedan 70 = 2 940; +60 × 45 = 5 640 / 130
    let avg: unknown;
    let outTotal: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Ventas de la semana")
          outTotal = ev.value("Kardex", ws.getCell(Number(c.row), 8).address);
        if (c.value === "Compra factura 4630")
          avg = ev.value("Kardex", ws.getCell(Number(c.row), 11).address);
      }),
    );
    expect(outTotal).toBe(3360);
    expect(Number(avg)).toBeCloseTo(5640 / 130, 4);
  });

  it("control-de-fiados: saldo por cliente y total", async () => {
    const { wb, ev } = await buildExample("control-de-fiados");
    expect(valueRightOf(wb, ev, "Clientes", "Total por cobrar")).toBe(1225);
    expect(tableRow(wb, ev, "Clientes", "Cliente", "Don Juan Pérez")["Estado"]).toBe(
      "Pasó su límite",
    );
  });

  it("lista-de-precios-margen: precio con margen e ISV", async () => {
    const { wb, ev } = await buildExample("lista-de-precios-margen");
    // 68 / (1 − 0.25) = 90.67 + 15 % = 104.27 → redondeo a 1 = 105
    const det = tableRow(wb, ev, "Precios", "Código", "P002");
    expect(Number(det["Precio sin ISV"])).toBeCloseTo(90.6667, 3);
    expect(det["Precio final"]).toBe(105);
  });

  it("presupuesto-mensual: gastado por categoría y ahorro", async () => {
    const { wb, ev } = await buildExample("presupuesto-mensual");
    expect(tableRow(wb, ev, "Presupuesto", "Categoría de gasto", "Alimentación")["Gastado"]).toBe(
      4300,
    );
    expect(valueRightOf(wb, ev, "Presupuesto", "Lo que queda (ahorro)")).toBe(24500 - 12150);
  });

  it("gastos-e-ingresos: balance mensual", async () => {
    const { wb, ev } = await buildExample("gastos-e-ingresos");
    const enero = tableRow(wb, ev, "Resumen", "Mes", "Enero");
    expect(enero["Ingresos"]).toBe(20000);
    expect(enero["Gastos"]).toBe(9400);
    expect(enero["Balance"]).toBe(10600);
  });

  it("control-de-remesas: conversión con tipo de cambio y comisión", async () => {
    const { wb, ev } = await buildExample("control-de-remesas");
    // 300 × 26.40 + 200 × 26.50 − 50 + 350 × 26.50
    expect(valueRightOf(wb, ev, "Remesas", "Totales")).toBe(850);
    const enero = tableRow(wb, ev, "Resumen", "Mes", "Enero");
    expect(enero["HNL"]).toBeCloseTo(7920 + 5250, 2);
  });

  it("cuotas-patronato: morosos y saldo en caja", async () => {
    const { wb, ev } = await buildExample("cuotas-patronato");
    expect(
      tableRow(wb, ev, "Cuotas", "Vivienda / familia", "Casa 2 — Familia López")["Saldo pendiente"],
    ).toBe(200);
    expect(valueRightOf(wb, ev, "Resumen", "Saldo en caja")).toBe(800 - 450);
    expect(valueRightOf(wb, ev, "Resumen", "Viviendas morosas")).toBe(1);
  });

  it("cajas-de-ahorro-cooperativas: fondos y reparto de utilidades", async () => {
    const { wb, ev } = await buildExample("cajas-de-ahorro-cooperativas");
    expect(valueRightOf(wb, ev, "Resumen y utilidades", "Total ahorrado por los socios")).toBe(
      1800,
    );
    const jose = tableRow(wb, ev, "Resumen y utilidades", "Socio", "José Martínez");
    expect(jose["Utilidad que le corresponde"]).toBeCloseTo(133.33, 2);
  });

  it("control-de-alquileres: por cobrar al corte", async () => {
    const { wb, ev } = await buildExample("control-de-alquileres");
    expect(valueRightOf(wb, ev, "Alquileres", "Por cobrar")).toBe(5500);
  });

  it("notas-y-promedios: promedio, estado y posición", async () => {
    const { wb, ev } = await buildExample("notas-y-promedios");
    const carlos = tableRow(wb, ev, "Español", "Alumno", "Carlos Eduardo Mejía");
    expect(carlos["Promedio"]).toBe(66);
    expect(carlos["Estado"]).toBe("Reprobado");
    expect(tableRow(wb, ev, "Consolidado", "Alumno", "Daniela Ramos")["Posición"]).toBe(1);
  });

  it("pensiones-y-mensualidades: saldo con beca y matrícula", async () => {
    const { wb, ev } = await buildExample("pensiones-y-mensualidades");
    expect(tableRow(wb, ev, "Mensualidades", "Alumno", "Diego Fúnez")["Saldo pendiente"]).toBe(
      1500,
    );
    expect(tableRow(wb, ev, "Mensualidades", "Alumno", "Valeria Cruz")["Saldo pendiente"]).toBe(
      1000,
    );
  });
});
