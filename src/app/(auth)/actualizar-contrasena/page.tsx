import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña | Excel Codezun",
  robots: { index: false },
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Crea una nueva contraseña">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
