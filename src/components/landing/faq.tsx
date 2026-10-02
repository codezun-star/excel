import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ_ITEMS = [
  {
    q: "¿Las plantillas funcionan en Google Sheets?",
    a: "Sí. Todas las fórmulas se escriben como fórmulas reales de Excel compatibles con Google Sheets y LibreOffice. Sube el archivo a Google Drive y ábrelo con Hojas de cálculo.",
  },
  {
    q: "¿Necesito crear una cuenta para descargar?",
    a: "No. Puedes configurar y descargar las plantillas gratis sin registrarte. La cuenta sirve para guardar tus configuraciones y volver a usarlas.",
  },
  {
    q: "¿Mis datos se envían a algún servidor?",
    a: "Las plantillas gratis se generan directamente en tu navegador: el nombre de tu negocio, tu RTN o tu logo no se envían a ningún servidor. Solo si guardas una configuración en tu cuenta se almacena para que puedas reutilizarla.",
  },
  {
    q: "¿Las tasas del ISV, IHSS, RAP e ISR están actualizadas?",
    a: "Cada plantilla fiscal o laboral toma sus tasas del módulo de reglas de Honduras, que indica la fecha de su última revisión y las fuentes oficiales. Siempre verifica los valores vigentes con tu contador antes de presentar declaraciones.",
  },
  {
    q: "¿Puedo poner el logo y los colores de mi negocio?",
    a: "Sí. En las plantillas de documentos (facturas, cotizaciones, recibos) puedes subir tu logo y elegir el color principal antes de descargar.",
  },
  {
    q: "¿Qué pasa si una tasa cambia después de descargar?",
    a: "Todas las tasas están en una hoja Parámetros dentro del archivo: puedes actualizarlas ahí o volver a generar la plantilla con las reglas nuevas.",
  },
];

export function Faq() {
  return (
    <Accordion type="single" collapsible className="rounded-xl border bg-card px-5">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
