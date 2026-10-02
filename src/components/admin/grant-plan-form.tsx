"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { grantPlan, revokeCourtesy } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function GrantPlanForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<"pro" | "negocio">("pro");
  const [months, setMonths] = useState(1);
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <select
        aria-label="Plan"
        value={plan}
        onChange={(e) => setPlan(e.target.value as "pro" | "negocio")}
        className="h-8 rounded-md border bg-background px-2 text-sm"
      >
        <option value="pro">Pro</option>
        <option value="negocio">Negocio</option>
      </select>
      <select
        aria-label="Meses"
        value={months}
        onChange={(e) => setMonths(Number(e.target.value))}
        className="h-8 rounded-md border bg-background px-2 text-sm"
      >
        {[1, 3, 6, 12].map((m) => (
          <option key={m} value={m}>
            {m} {m === 1 ? "mes" : "meses"}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await grantPlan({ userId, planCode: plan, months });
            if (res.ok) {
              toast.success("Acceso otorgado");
              router.refresh();
            } else toast.error(res.error);
          })
        }
      >
        Otorgar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("¿Vencer los accesos de cortesía de este usuario?")) return;
          start(async () => {
            const res = await revokeCourtesy(userId);
            if (res.ok) router.refresh();
            else toast.error(res.error);
          });
        }}
      >
        Quitar
      </Button>
    </div>
  );
}
