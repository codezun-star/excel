import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "planificador-de-comidas-y-rutinas",
  title: "Planificador de comidas y rutinas",
  shortDescription:
    "Menú semanal con tus platillos, recetas con ingredientes, lista de compras que se calcula sola con su costo, y rutina de ejercicio con minutos cumplidos.",
  category: "salud",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "Menú semanal y lista de compras en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para planificar el menú de la semana, calcular la lista del súper y su costo, y seguir tu rutina de ejercicio.",
    keywords: [
      "menú semanal excel",
      "planificador de comidas",
      "lista de compras automática",
      "rutina de ejercicio semanal",
    ],
  },
  details: {
    includes: [
      "Menú de lunes a domingo con desayuno, meriendas, almuerzo y cena",
      "Platillos con sus ingredientes y costo por preparación",
      "Lista de compras: lo que necesitas menos lo que ya tienes, con costo estimado",
      "Rutina semanal de ejercicio con minutos planificados y cumplidos frente a la meta",
    ],
    audience: [
      "Familias que quieren ahorrar en el súper y comer mejor",
      "Personas que empiezan una rutina de ejercicio",
    ],
  },
});
