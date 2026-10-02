import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Excel Codezun",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Crea tu cuenta gratis"
      subtitle="Sin tarjeta. Guarda configuraciones y lleva el historial de tus descargas."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-strong hover:underline">
            Ingresa
          </Link>
        </>
      }
    >
      <NotConfiguredNotice />
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
