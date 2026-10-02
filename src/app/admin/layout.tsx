import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/billing/admin";

export const metadata: Metadata = { title: "Admin | Excel Codezun", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Administración</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
