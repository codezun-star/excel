import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { RecoverForm } from "@/components/auth/recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Excel Codezun",
  robots: { index: false },
};

export default function RecoverPage() {
  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          Volver a ingresar
        </Link>
      }
    >
      <NotConfiguredNotice />
      <RecoverForm />
    </AuthShell>
  );
}
