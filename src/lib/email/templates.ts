import { absoluteUrl, SITE } from "@/lib/site";

function wrap(lines: string[]): string {
  return [...lines, "", `— El equipo de ${SITE.name}`, absoluteUrl("/")].join("\n");
}

export const emailTemplates = {
  proofReceived(input: { reference: string; description: string }) {
    return {
      subject: `Recibimos tu comprobante (${input.reference})`,
      text: wrap([
        "¡Gracias!",
        "",
        `Recibimos el comprobante de pago de: ${input.description}.`,
        `Referencia: ${input.reference}`,
        "",
        "Lo revisamos en horario hábil (normalmente el mismo día). Te avisaremos por este medio cuando tu acceso esté activo.",
        `Puedes ver el estado en ${absoluteUrl("/cuenta/suscripcion")}`,
      ]),
    };
  },
  paymentApproved(input: { reference: string; description: string; validUntil: string | null }) {
    const until = input.validUntil
      ? new Date(input.validUntil).toLocaleDateString("es-HN", { dateStyle: "long" })
      : null;
    return {
      subject: "¡Tu pago fue aprobado!",
      text: wrap([
        `Tu pago de ${input.description} (referencia ${input.reference}) fue aprobado.`,
        until ? `Tu acceso está activo hasta el ${until}.` : "Tu acceso ya está activo.",
        "",
        `Empieza aquí: ${absoluteUrl("/plantillas")}`,
      ]),
    };
  },
  paymentRejected(input: { reference: string; description: string; reason: string }) {
    return {
      subject: `No pudimos confirmar tu pago (${input.reference})`,
      text: wrap([
        `No pudimos confirmar el pago de ${input.description} (referencia ${input.reference}).`,
        `Motivo: ${input.reason}`,
        "",
        `Si crees que es un error, responde este correo o escríbenos a ${SITE.contactEmail} con tu comprobante.`,
      ]),
    };
  },
  adminNewProof(input: { reference: string; description: string; email: string | null }) {
    return {
      subject: `Nuevo comprobante por revisar: ${input.reference}`,
      text: wrap([
        `Cliente: ${input.email ?? "(sin correo)"}`,
        `Compra: ${input.description}`,
        `Referencia: ${input.reference}`,
        "",
        `Revisar en ${absoluteUrl("/admin/pagos")}`,
      ]),
    };
  },
};
