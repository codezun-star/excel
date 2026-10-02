import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "camaroneras-pesca",
  title: "Control de camaronera y acuicultura",
  shortDescription:
    "Ciclos por estanque con siembra, alimento, costos, cosechas, rendimiento por hectárea, conversión alimenticia, sobrevivencia y ganancia.",
  category: "negocios",
  businessTypes: ["pesca"],
  tier: "pro",
  seo: {
    title: "Control de camaronera por estanque en Excel | Excel Codezun",
    description:
      "Plantilla para camaroneras y granjas de tilapia: siembra, alimento, cosecha por estanque, factor de conversión, sobrevivencia y rentabilidad.",
    keywords: [
      "control de camaronera excel",
      "factor de conversión alimenticia",
      "rendimiento por hectárea camarón",
      "control de estanques tilapia",
    ],
  },
  details: {
    includes: [
      "Estanques con área, fecha y cantidad sembrada y costo de semilla",
      "Alimento y otros costos por estanque",
      "Cosechas con libras, peso promedio y precio",
      "Rendimiento por hectárea, FCR, sobrevivencia, días de cultivo y ganancia",
    ],
    audience: ["Camaroneras del Golfo de Fonseca", "Granjas de tilapia y acuicultores"],
  },
});
