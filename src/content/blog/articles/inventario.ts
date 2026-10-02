import type { Article } from "../types";

export const inventario: Article = {
  slug: "control-de-inventario-excel-pulperia",
  title: "Control de inventario en Excel para pulperías y pequeños negocios",
  seoTitle: "Control de inventario en Excel para pulperías (gratis)",
  description:
    "Cómo llevar el inventario de una pulpería o tienda en Excel: entradas, salidas, stock mínimo, punto de reorden, kardex y control de fiados, con plantillas gratis.",
  excerpt:
    "Deja de adivinar qué pedir: entradas y salidas, stock mínimo, punto de reorden y control de lo fiado en una sola hoja.",
  keywords: [
    "control de inventario Excel",
    "inventario pulpería",
    "inventario tienda pequeña",
    "stock mínimo Excel",
    "kardex Excel",
    "control de fiados",
  ],
  category: "negocios",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["inventario-stock-minimo", "kardex", "control-de-fiados", "lista-de-precios-margen"],
  faq: [
    {
      q: "¿Cada cuánto debo contar el inventario?",
      a: "Haz un conteo completo al menos una vez al mes y conteos rápidos semanales de los productos que más se venden o que más se pierden.",
    },
    {
      q: "¿Qué es el stock mínimo?",
      a: "Es la cantidad por debajo de la cual debes volver a pedir un producto para no quedarte sin existencias mientras llega el proveedor.",
    },
    {
      q: "¿Sirve Excel en el celular?",
      a: "Sí. Puedes abrir las plantillas con la app de Excel o con Google Sheets en tu teléfono y registrar entradas y salidas desde el mostrador.",
    },
  ],
  body: () => [
    {
      type: "p",
      text: "En una pulpería, una ferretería o una tienda de barrio, el dinero está en los estantes. Si no sabes cuánto tienes de cada producto, compras de más lo que no se vende y te quedas sin lo que sí sale. Con una hoja de Excel sencilla puedes controlar tu inventario en minutos al día.",
    },
    { type: "h2", id: "que-registrar", text: "Qué registrar de cada producto" },
    {
      type: "ul",
      items: [
        "Código o nombre corto, unidad (unidad, libra, caja) y proveedor.",
        "Costo y precio de venta (para conocer tu margen).",
        "Existencia inicial, **entradas** (compras) y **salidas** (ventas, mermas).",
        "**Stock mínimo** y existencia actual con una alerta de «Pedir».",
      ],
    },
    { type: "h2", id: "stock-minimo", text: "Cómo calcular el stock mínimo y el punto de reorden" },
    {
      type: "p",
      text: "Una regla práctica: **punto de reorden = venta diaria promedio × días que tarda el proveedor + stock de seguridad**. Si vendes 12 sodas al día, el proveedor tarda 3 días y quieres un colchón de 2 días: 12 × 3 + 12 × 2 = **60 unidades**. Cuando bajes de 60, pides.",
    },
    {
      type: "formula",
      formula: '=SI(F2<=G2,"Pedir","OK")',
      caption:
        "F2: existencia actual · G2: stock mínimo. Con formato condicional, la celda se pinta de rojo cuando toca pedir.",
    },
    {
      type: "cta",
      template: "inventario-stock-minimo",
      title: "Inventario con alertas de stock mínimo",
      text: "Registra productos, entradas y salidas; la plantilla calcula existencias y valor del inventario y te alerta de lo que debes pedir o ya se agotó.",
    },
    { type: "h2", id: "kardex", text: "Kardex: el historial de cada producto" },
    {
      type: "p",
      text: "Si necesitas saber el **costo promedio** de lo que vendes (por ejemplo, para tu contabilidad o para fijar precios), usa un kardex: cada movimiento recalcula el costo promedio ponderado y el saldo.",
    },
    {
      type: "cta",
      template: "kardex",
      title: "Kardex con costo promedio",
      text: "Entradas, salidas y saldo con costo promedio ponderado calculado automáticamente.",
    },
    { type: "h2", id: "fiados", text: "Controla lo fiado" },
    {
      type: "p",
      text: "El crédito a vecinos es parte del negocio, pero sin control se convierte en pérdida. Anota cada fiado con fecha, cliente y monto, y cada abono. Así sabes quién debe, cuánto y desde cuándo.",
    },
    {
      type: "cta",
      template: "control-de-fiados",
      title: "Cuaderno de fiados en Excel",
      text: "Fiados, abonos, saldo por cliente, límite de crédito y el total que tienes por cobrar.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Revisa tus márgenes",
      text: "Un buen inventario va de la mano con buenos precios. Calcula tu margen por producto con la [lista de precios con margen](/plantillas/lista-de-precios-margen) y cuadra el efectivo con la [caja diaria](/plantillas/caja-diaria-arqueo).",
    },
  ],
};
