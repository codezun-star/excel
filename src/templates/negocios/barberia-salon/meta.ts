import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "barberia-salon",
  title: "Control de barbería y salón de belleza",
  shortDescription:
    "Servicios del día por estilista o barbero con lista de precios, descuentos, propinas, comisión de cada uno y ventas por día.",
  category: "negocios",
  businessTypes: ["barberia-salon"],
  tier: "free",
  seo: {
    title: "Control de barbería y salón de belleza en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para barberías y salones: servicios por estilista, comisiones, propinas, ventas diarias y lista de precios.",
    keywords: [
      "control de barbería excel",
      "comisiones de estilistas",
      "registro de servicios salón de belleza",
      "control de ventas barbería",
    ],
  },
  details: {
    includes: [
      "Lista de servicios con su precio",
      "Estilistas o barberos con su porcentaje de comisión",
      "Registro de cada servicio con descuento, propina y forma de pago",
      "Resumen por estilista (comisión + propinas) y ventas por día",
    ],
    audience: ["Barberías", "Salones de belleza, uñas y spa"],
  },
});
