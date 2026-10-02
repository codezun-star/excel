import type { Metadata } from "next";

import { PaddleCheckout } from "@/components/checkout/paddle-checkout";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pago seguro | Excel Codezun",
  robots: { index: false },
};

/**
 * "Default payment link" de Paddle: Paddle redirige aquí con ?_ptxn=txn_… y
 * Paddle.js abre el checkout. Configúrala en Paddle → Checkout settings.
 */
export default function PaddlePayPage() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <h1 className="text-2xl font-extrabold">Abriendo el pago seguro…</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Si la ventana de pago no aparece, revisa que tu navegador no esté bloqueando ventanas
        emergentes y recarga la página.
      </p>
      <PaddleCheckout
        token={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""}
        environment={process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox"}
        successUrl={absoluteUrl("/cuenta/suscripcion?pago=procesando")}
      />
    </div>
  );
}
