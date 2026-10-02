import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, styleCalc, styleHeader, styleInput } from "@/lib/excel/styles";
import { addCategorySummary } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ComidasConfig } from "./form";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const INGREDIENTS: [string, string, number, number][] = [
  ["Tortillas de harina", "unidad", 4, 0],
  ["Frijoles rojos", "libra", 22, 1],
  ["Huevos", "unidad", 4.5, 6],
  ["Queso seco", "libra", 70, 0],
  ["Mantequilla crema", "taza", 25, 0],
  ["Arroz", "libra", 18, 2],
  ["Plátano maduro", "unidad", 7, 0],
  ["Pollo", "libra", 45, 0],
  ["Tomate", "libra", 15, 0],
  ["Avena", "libra", 30, 0],
  ["Banano", "unidad", 2, 0],
  ["Leche", "litro", 32, 1],
];

/** Platillos de ejemplo: nombre, tiempo de comida e ingredientes [nombre, cantidad]. */
const DISHES: [string, string, [string, number][]][] = [
  [
    "Baleadas con huevo",
    "Desayuno",
    [
      ["Tortillas de harina", 8],
      ["Frijoles rojos", 0.5],
      ["Queso seco", 0.25],
      ["Mantequilla crema", 0.5],
      ["Huevos", 4],
    ],
  ],
  [
    "Avena con banano",
    "Desayuno",
    [
      ["Avena", 0.5],
      ["Leche", 1],
      ["Banano", 4],
    ],
  ],
  [
    "Pollo con arroz y ensalada",
    "Almuerzo",
    [
      ["Pollo", 2],
      ["Arroz", 1],
      ["Tomate", 1],
    ],
  ],
  [
    "Frijoles con plátano y queso",
    "Cena",
    [
      ["Frijoles rojos", 1],
      ["Plátano maduro", 4],
      ["Queso seco", 0.25],
      ["Tortillas de harina", 8],
    ],
  ],
];

export const build: TemplateBuild<ComidasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Menú y rutina semanal", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const menu = addSheet(wb, "Menú", { tabColor: theme.primary, landscape: true });
  const dish = addSheet(wb, "Platillos", { freezeRows: 4, tabColor: theme.primary });
  const rec = addSheet(wb, "Recetas", { freezeRows: 4, tabColor: theme.primary });
  const shop = addSheet(wb, "Lista de compras", { freezeRows: 4, tabColor: theme.primary });
  const fit = addSheet(wb, "Rutina", { freezeRows: 6, tabColor: theme.primary });
  const ex = config.example;
  const meals = config.meals;

  // Rangos fijos para que las hojas se puedan referir entre sí
  const DISH_ROWS = 60;
  const ING_ROWS = 150;
  const dishNames = `'Platillos'!$A$5:$A$${4 + DISH_ROWS}`;
  const ingNames = `'Lista de compras'!$A$5:$A$${4 + ING_ROWS}`;
  const ingRange = (col: string) => `'Lista de compras'!$${col}$5:$${col}$${4 + ING_ROWS}`;

  // Menú semanal
  addSheetHeader(menu, {
    title,
    subtitle: "Elige un platillo para cada tiempo de comida; la lista de compras se calcula sola.",
    theme,
    width: 8,
  });
  menu.getColumn(1).width = 14;
  ["Comida", ...DAYS].forEach((h, i) => {
    const c = menu.getCell(4, i + 1);
    c.value = h;
    styleHeader(c, theme);
    if (i > 0) menu.getColumn(i + 1).width = 18;
  });
  meals.forEach((meal, i) => {
    const r = 5 + i;
    const mc = menu.getCell(r, 1);
    mc.value = meal;
    styleCalc(mc, theme);
    menu.getRow(r).height = 36;
    DAYS.forEach((_, d) => {
      const c = menu.getCell(r, 2 + d);
      styleInput(c, theme, "#FFFFFF");
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      if (ex) {
        const options = DISHES.filter(([, m]) => m === meal);
        if (options.length) c.value = options[d % options.length]![0];
      }
    });
  });
  const lastMenuRow = 4 + meals.length;
  const grid = `B5:H${lastMenuRow}`;
  const gridAbs = `'Menú'!$B$5:$H$${lastMenuRow}`;
  listFromRange(menu, grid, dishNames);

  // Platillos
  addSheetHeader(dish, {
    title: "Platillos",
    subtitle:
      "Cada platillo con su tiempo de comida; el costo sale de sus ingredientes en Recetas.",
    theme,
    width: 5,
  });
  addTable(dish, {
    startRow: 4,
    columns: [
      { key: "name", header: "Platillo", kind: "text", width: 30 },
      { key: "meal", header: "Tiempo de comida", kind: "list", width: 14, list: meals },
      {
        key: "cost",
        header: "Costo por preparación",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS('Recetas'!$F$5:$F$1004,'Recetas'!$A$5:$A$1004,${r.c("name")}))`,
      },
      {
        key: "times",
        header: "Veces en el menú",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${gridAbs},${r.c("name")}))`,
      },
      {
        key: "week",
        header: "Costo en la semana",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${r.c("cost")}*${r.c("times")})`,
      },
    ],
    rows: DISH_ROWS,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: DISHES.map(([name, meal]) => ({ name, meal: meals.includes(meal) ? meal : meals[0] })),
  });

  // Recetas (ingredientes por platillo)
  addSheetHeader(rec, {
    title: "Recetas",
    subtitle: `Ingredientes de cada platillo para ${config.servings} personas.`,
    theme,
    width: 7,
  });
  const rows: { dish: string; ing: string; qty: number }[] = DISHES.flatMap(([d, , ings]) =>
    ings.map(([ing, qty]) => ({ dish: d, ing, qty })),
  );
  const rt = addTable(rec, {
    startRow: 4,
    columns: [
      { key: "dish", header: "Platillo", kind: "list", width: 28, list: { source: dishNames } },
      { key: "ing", header: "Ingrediente", kind: "list", width: 22, list: { source: ingNames } },
      { key: "qty", header: "Cantidad", kind: "number", width: 10 },
      {
        key: "unit",
        header: "Unidad",
        kind: "formula",
        width: 10,
        formula: (r) =>
          `IF(${r.c("ing")}="","",IFERROR(INDEX(${ingRange("B")},MATCH(${r.c("ing")},${ingNames},0)),""))`,
      },
      {
        key: "price",
        header: "Precio por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("ing")}="","",IFERROR(INDEX(${ingRange("C")},MATCH(${r.c("ing")},${ingNames},0)),0))`,
      },
      {
        key: "cost",
        header: "Costo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(${r.c("ing")}="","",N(${r.c("qty")})*${r.c("price")})`,
      },
      {
        key: "need",
        header: "Necesario en la semana",
        kind: "formula",
        resultKind: "number",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("dish")}="",${r.c("ing")}=""),"",N(${r.c("qty")})*COUNTIF(${gridAbs},${r.c("dish")}))`,
      },
    ],
    rows: 1000,
    theme,
    ctx,
    autoFilter: true,
    example: rows,
  });
  if (rt.firstRow !== 5 || rt.lastRow !== 1004 || rt.letter("cost") !== "F")
    throw new Error("Rango de recetas inesperado");

  // Lista de compras
  addSheetHeader(shop, {
    title: "Lista de compras",
    subtitle: "Lo que necesitas para el menú menos lo que ya tienes en casa.",
    theme,
    width: 8,
  });
  const st = addTable(shop, {
    startRow: 4,
    columns: [
      { key: "ing", header: "Ingrediente", kind: "text", width: 24 },
      { key: "unit", header: "Unidad", kind: "text", width: 10 },
      { key: "price", header: "Precio por unidad", kind: "currency", width: 12 },
      {
        key: "need",
        header: "Necesitas",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) =>
          `IF(${r.c("ing")}="","",SUMIFS('Recetas'!$G$5:$G$1004,'Recetas'!$B$5:$B$1004,${r.c("ing")}))`,
      },
      { key: "have", header: "Tienes en casa", kind: "number", width: 10 },
      {
        key: "buy",
        header: "Comprar",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) => `IF(${r.c("ing")}="","",MAX(0,${r.c("need")}-N(${r.c("have")})))`,
      },
      {
        key: "cost",
        header: "Costo estimado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("ing")}="","",${r.c("buy")}*N(${r.c("price")}))`,
      },
      {
        key: "done",
        header: "¿Comprado?",
        kind: "list",
        width: 10,
        list: ["Sí", "No"],
        align: "center",
      },
    ],
    rows: ING_ROWS,
    theme,
    ctx,
    totals: { label: "Total a gastar" },
    example: INGREDIENTS.map(([ing, unit, price, have]) => ({
      ing,
      unit,
      price,
      have: ex ? have : undefined,
    })),
  });
  const bc = st.letter("buy");
  highlightWhen(
    shop,
    `A${st.firstRow}:${st.letter("done")}${st.lastRow}`,
    `AND(N($${bc}${st.firstRow})>0,$${st.letter("done")}${st.firstRow}<>"Sí")`,
    { fill: "#FFF2CC" },
    1,
  );
  highlightWhen(
    shop,
    `A${st.firstRow}:${st.letter("done")}${st.lastRow}`,
    `$${st.letter("done")}${st.firstRow}="Sí"`,
    { color: theme.muted },
    2,
  );
  addFields(shop, {
    startRow: 2,
    labelCol: 10,
    valueCol: 11,
    fields: [
      {
        key: "pending",
        label: "Productos por comprar",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `COUNTIFS(${st.range("buy")},">0",${st.range("done")},"<>Sí")`,
      },
    ],
    theme,
    ctx,
  });
  shop.getColumn(10).width = 22;

  // Rutina de ejercicio
  addSheetHeader(fit, {
    title: "Rutina de ejercicio",
    subtitle: "Planifica tus minutos y marca lo que cumpliste.",
    theme,
    width: 6,
  });
  const goal = addFields(fit, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "goal", label: "Meta semanal (minutos)", kind: "integer", value: config.exerciseGoal },
    ],
    theme,
    ctx,
  });
  const ft = addTable(fit, {
    startRow: 6,
    columns: [
      { key: "day", header: "Día", kind: "list", width: 12, list: DAYS },
      { key: "activity", header: "Actividad", kind: "text", width: 26 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 14,
        list: [
          "Caminar o correr",
          "Fuerza",
          "Flexibilidad",
          "Deporte",
          "Baile",
          "Bicicleta",
          "Descanso",
        ],
      },
      { key: "planned", header: "Minutos planificados", kind: "integer", width: 12, total: "sum" },
      {
        key: "done",
        header: "¿Cumplido?",
        kind: "list",
        width: 11,
        list: ["Sí", "No"],
        align: "center",
      },
      {
        key: "minutes",
        header: "Minutos cumplidos",
        kind: "formula",
        resultKind: "integer",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("day")}="","",IF(${r.c("done")}="Sí",N(${r.c("planned")}),0))`,
      },
    ],
    rows: 21,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: DAYS.map((day, i) => ({
      day,
      activity:
        i === 6
          ? "Descanso"
          : i % 2 === 0
            ? "Caminata rápida"
            : "Sentadillas, lagartijas y plancha",
      type: i === 6 ? "Descanso" : i % 2 === 0 ? "Caminar o correr" : "Fuerza",
      planned: i === 6 ? 0 : i % 2 === 0 ? 30 : 20,
      done: ex ? (i < 3 ? "Sí" : undefined) : undefined,
    })),
  });
  const dc = ft.letter("done");
  highlightWhen(
    fit,
    `A${ft.firstRow}:${ft.letter("minutes")}${ft.lastRow}`,
    `$${dc}${ft.firstRow}="Sí"`,
    { fill: theme.okSoft },
    1,
  );
  addFields(fit, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "planned",
        label: "Planificado vs. meta",
        kind: "calc",
        resultKind: "percent",
        formula: () => `IF(${goal.cell("goal")}=0,"",${ft.total("planned")}/${goal.cell("goal")})`,
      },
      {
        key: "done",
        label: "Cumplido vs. meta",
        kind: "calc",
        resultKind: "percent",
        emphasis: true,
        formula: () => `IF(${goal.cell("goal")}=0,"",${ft.total("minutes")}/${goal.cell("goal")})`,
      },
    ],
    theme,
    ctx,
  });
  addCategorySummary(fit, {
    startRow: ft.totalRow! + 3,
    startCol: 1,
    labelHeader: "Tipo de actividad",
    sourceCells: [
      "Caminar o correr",
      "Fuerza",
      "Flexibilidad",
      "Deporte",
      "Baile",
      "Bicicleta",
    ].map((t) => `"${t}"`),
    values: [
      {
        header: "Minutos planificados",
        kind: "integer",
        formula: (k) => `SUMIFS(${ft.range("planned")},${ft.range("type")},${k.labelCell})`,
      },
      {
        header: "Minutos cumplidos",
        kind: "integer",
        formula: (k) => `SUMIFS(${ft.range("minutes")},${ft.range("type")},${k.labelCell})`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [menu, dish, rec, shop, fit]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Planificador de comidas y rutinas",
    description: "Planifica lo que comerás, compra solo lo necesario y cumple tu rutina.",
    steps: [
      "En Lista de compras escribe tus ingredientes con su unidad y precio, y cuánto tienes en casa.",
      "En Platillos escribe tus comidas favoritas y en Recetas sus ingredientes con la cantidad para tu familia.",
      "En Menú elige el platillo de cada tiempo de comida de la semana.",
      "La Lista de compras calcula cuánto comprar y cuánto vas a gastar; marca Sí al comprarlo.",
      "En Rutina planifica tus minutos de ejercicio y marca los días cumplidos.",
    ],
    tips: [
      "Cocina porciones dobles y repite el platillo al día siguiente para ahorrar tiempo y gas.",
      "Antes de empezar una rutina nueva consulta con tu médico si tienes alguna condición de salud.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
