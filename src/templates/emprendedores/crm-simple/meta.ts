import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "crm-simple",
  title: "CRM simple",
  shortDescription:
    "Clientes potenciales con origen, valor y etapa de venta, probabilidad y valor ponderado, historial de seguimiento, próxima acción con alertas y embudo por etapa, origen y vendedor.",
  category: "emprendedores",
  businessTypes: ["servicios", "freelancer", "inmobiliaria", "comercio"],
  tier: "free",
  seo: {
    title: "CRM en Excel gratis: seguimiento de clientes y embudo de ventas | Excel Codezun",
    description:
      "Plantilla gratis de CRM: clientes potenciales, etapas de venta, seguimientos, próximas acciones con alertas y embudo con conversión por origen.",
    keywords: [
      "crm en excel gratis",
      "seguimiento de clientes excel",
      "embudo de ventas excel",
      "control de prospectos",
    ],
  },
  details: {
    includes: [
      "Clientes potenciales con origen, interés, valor estimado y vendedor",
      "Etapas de venta con probabilidad editable y valor ponderado",
      "Historial de llamadas, mensajes y visitas con el último contacto automático",
      "Próxima acción con alerta de atrasados y clientes sin contacto",
      "Embudo por etapa, conversión por origen, ventas por vendedor y por mes",
    ],
    audience: [
      "Vendedores, corredores de bienes raíces y agentes de seguros",
      "Negocios de servicios que cotizan antes de vender",
    ],
  },
});
