import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "factura-con-isv",
  title: "Factura con ISV",
  shortDescription:
    "Factura lista para imprimir con CAI, rango autorizado, ISV 15 % y 18 % por línea, exentos y total en letras.",
  category: "facturacion",
  businessTypes: [
    "comercio",
    "pulperia",
    "ferreteria",
    "farmacia",
    "restaurante",
    "taller",
    "tienda-ropa",
    "servicios",
    "freelancer",
    "cafeteria-panaderia",
  ],
  countries: ["HN"],
  tier: "free",
  regulated: "fiscal",
  featured: true,
  seo: {
    title: "Factura con ISV en Excel (Honduras) gratis — CAI, 15 % y 18 % | Excel Codezun",
    description:
      "Descarga gratis una factura en Excel para Honduras con CAI, rango autorizado, ISV 15 % y 18 % por línea, importes exentos y total en letras. Configúrala con tu logo y RTN.",
    keywords: [
      "factura excel honduras",
      "formato de factura con isv",
      "factura con cai excel",
      "plantilla factura honduras",
      "factura isv 15% 18%",
    ],
  },
  details: {
    includes: [
      "Encabezado con tu logo, RTN, dirección y teléfono",
      "Numeración con prefijo SAR y correlativo, CAI, rango autorizado y fecha límite",
      "Tabla de líneas con fórmulas: subtotal, descuento, ISV por línea y total",
      "Totales desglosados: exento, gravado 15 %, gravado 18 %, ISV 15 % e ISV 18 %",
      "Total en letras automático y alertas si te sales del rango autorizado",
      "Hoja de parámetros con las tasas vigentes y hoja de instrucciones",
    ],
    audience: [
      "Negocios y emprendedores con facturación manual autorizada por el SAR",
      "Profesionales independientes que emiten facturas de servicios",
      "Contadores que preparan formatos para sus clientes",
    ],
  },
});
