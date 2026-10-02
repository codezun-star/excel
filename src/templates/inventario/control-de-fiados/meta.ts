import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-fiados",
  title: "Control de fiados",
  shortDescription:
    "Lleva lo que te deben tus clientes: fiados, abonos, saldo por cliente, límite de crédito y total por cobrar.",
  category: "inventario",
  businessTypes: ["pulperia", "comercio", "ferreteria", "farmacia"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de fiados en Excel gratis para pulperías | Excel Codezun",
    description:
      "Plantilla gratis para controlar fiados y créditos de clientes en Excel: abonos, saldo por cliente, límite de crédito y total por cobrar.",
    keywords: [
      "control de fiados excel",
      "cuaderno de fiados",
      "creditos de clientes pulperia",
      "control de creditos excel",
    ],
  },
  details: {
    includes: [
      "Lista de clientes con teléfono y límite de crédito",
      "Registro de fiados y abonos por fecha",
      "Saldo de cada cliente y alerta si pasa su límite",
      "Total por cobrar del negocio",
    ],
    audience: ["Pulperías y mini súper", "Tiendas de barrio que dan crédito"],
  },
});
