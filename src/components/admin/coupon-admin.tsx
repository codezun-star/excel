"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCoupon, setCouponActive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TARGETS = [
  { id: "pro", label: "Pro" },
  { id: "negocio", label: "Negocio" },
  { id: "compra-unica", label: "Compra única" },
] as const;

export function CouponForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [appliesTo, setAppliesTo] = useState<string[]>(["pro", "negocio"]);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          const res = await createCoupon({
            code: fd.get("code"),
            percentOff: fd.get("percentOff"),
            maxRedemptions: fd.get("maxRedemptions"),
            expiresAt: fd.get("expiresAt"),
            durationMonths: fd.get("durationMonths"),
            paddleDiscountId: fd.get("paddleDiscountId"),
            appliesTo,
          });
          if (res.ok) {
            toast.success("Cupón creado");
            form.reset();
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="c-code">Código</Label>
        <Input id="c-code" name="code" required placeholder="NAVIDAD25" className="uppercase" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="c-pct">% de descuento</Label>
          <Input
            id="c-pct"
            name="percentOff"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={20}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-max">Usos máximos</Label>
          <Input id="c-max" name="maxRedemptions" type="number" min={1} placeholder="Sin límite" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-exp">Vence</Label>
          <Input id="c-exp" name="expiresAt" type="date" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-dur">Meses (si es 100 %)</Label>
          <Input id="c-dur" name="durationMonths" type="number" min={1} max={36} defaultValue={1} />
        </div>
      </div>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1 text-sm font-medium">Aplica a</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {TARGETS.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={appliesTo.includes(t.id)}
                onChange={(e) =>
                  setAppliesTo((a) =>
                    e.target.checked ? [...a, t.id] : a.filter((x) => x !== t.id),
                  )
                }
                className="accent-[var(--brand)]"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-1.5">
        <Label htmlFor="c-paddle">Id del descuento en Paddle (opcional)</Label>
        <Input id="c-paddle" name="paddleDiscountId" placeholder="dsc_01…" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Crear cupón
      </Button>
    </form>
  );
}

export function CouponToggle({ code, active }: { code: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setCouponActive(code, !active);
          if (res.ok) router.refresh();
          else toast.error(res.error);
        })
      }
    >
      {active ? "Desactivar" : "Activar"}
    </Button>
  );
}
