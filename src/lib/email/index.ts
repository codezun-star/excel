import "server-only";

/**
 * Envío de correos con una interfaz mínima. Por defecto se imprimen en la
 * consola del servidor (desarrollo). Con EMAIL_PROVIDER=resend y
 * RESEND_API_KEY se envían con Resend. Para otro servicio, agregar un
 * adaptador que implemente EmailSender.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export const consoleSender: EmailSender = {
  async send(message) {
    console.info(
      `\n[correo] Para: ${message.to}\n[correo] Asunto: ${message.subject}\n${message.text}\n`,
    );
  },
};

export const resendSender: EmailSender = {
  async send(message) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Excel Codezun <no-responder@codezun.com>",
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
  },
};

export function getEmailSender(): EmailSender {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) return resendSender;
  return consoleSender;
}

/** Envía sin romper el flujo si el correo falla (se registra en el log). */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    await getEmailSender().send(message);
    return true;
  } catch (err) {
    console.error("[correo] No se pudo enviar:", (err as Error).message);
    return false;
  }
}
