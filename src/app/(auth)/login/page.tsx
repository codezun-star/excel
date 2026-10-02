import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { NotConfiguredNotice } from "@/components/auth/not-configured";

export const metadata: Metadata = { title: "Ingresar | Excel Codezun", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="Ingresa a tu cuenta"
      subtitle="Guarda tus configuraciones y vuelve a generar tus plantillas cuando quieras."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-strong hover:underline">
            Crea una gratis
          </Link>
        </>
      }
    >
      <NotConfiguredNotice />
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
