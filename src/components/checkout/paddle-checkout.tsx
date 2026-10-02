"use client";

import Script from "next/script";

interface PaddleGlobal {
  Environment: { set(env: string): void };
  Initialize(options: {
    token: string;
    checkout?: { settings?: { successUrl?: string; locale?: string; displayMode?: string } };
  }): void;
}

/** Carga Paddle.js; con ?_ptxn en la URL, Paddle abre el checkout de esa transacción. */
export function PaddleCheckout({
  token,
  environment,
  successUrl,
}: {
  token: string;
  environment: "sandbox" | "production";
  successUrl: string;
}) {
  if (!token) return <p className="mt-6 text-sm text-destructive">Paddle no está configurado.</p>;
  return (
    <Script
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={() => {
        const paddle = (window as unknown as { Paddle?: PaddleGlobal }).Paddle;
        if (!paddle) return;
        if (environment === "sandbox") paddle.Environment.set("sandbox");
        paddle.Initialize({
          token,
          checkout: { settings: { successUrl, locale: "es", displayMode: "overlay" } },
        });
      }}
    />
  );
}
