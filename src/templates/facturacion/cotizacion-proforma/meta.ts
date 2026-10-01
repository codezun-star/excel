import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "cotizacion-proforma",
  title: "Cotización / factura proforma",
  shortDescription:
    "Cotización con vigencia automática, condiciones comerciales, ISV opcional por línea y total en letras.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "servicios", "freelancer", "constructora", "taller"],
  tier: "free",
  featured: true,
  seo: {
    title: "Formato de cotización en Excel gratis (con ISV) | Excel Codezun",
    description:
      "Descarga gratis una cotización o factura proforma en Excel con tu logo, vigencia automática, ISV 15 % y 18 % opcional y total en letras.",
    keywords: [
      "formato de cotización excel",
      "cotización con isv",
      "factura proforma excel",
      "plantilla cotización honduras",
    ],
  },
  details: {
    includes: [
      "Encabezado con logo, RTN y datos de contacto",
      "Número de cotización con prefijo y correlativo",
      "Fecha de vigencia calculada a partir de los días de validez",
      "Líneas con descuento opcional, ISV por línea y totales",
      "Condiciones comerciales y espacio para la aceptación del cliente",
    ],
    audience: [
      "Comercios y distribuidores",
      "Proveedores de servicios y contratistas",
      "Freelancers",
    ],
  },
});
