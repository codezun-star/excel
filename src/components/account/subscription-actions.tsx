"use client";

import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  cancelSubscriptionRenewal,
  customerPortalUrl,
  redeemAccessCoupon,
} from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SubscriptionButtons({
  subscriptionId,
  canCancel,
  hasPortal,
}: {
  subscriptionId: string;
  canCancel: boolean;
  hasPortal: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {hasPortal && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await customerPortalUrl(subscriptionId);
              if (res.ok && res.data) window.open(res.data.url, "_blank", "noopener");
              else if (!res.ok) toast.error(res.error);
            })
          }
        >
          <ExternalLinkIcon />
          Administrar pago
        </Button>
      )}
      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                "¿Cancelar la renovación? Conservas el acceso hasta el final del período pagado.",
              )
            )
              return;
            start(async () => {
              const res = await cancelSubscriptionRenewal(subscriptionId);
              if (res.ok) {
                toast.success("Renovación cancelada");
                router.refresh();
              } else toast.error(res.error);
            });
          }}
        >
          {pending && <Loader2Icon className="animate-spin" />}
          Cancelar renovación
        </Button>
      )}
    </div>
  );
}

export function RedeemCouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await redeemAccessCoupon(code);
          if (res.ok) {
            toast.success("¡Cupón canjeado! Tu plan ya está activo.");
            setCode("");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="cupon-acceso">¿Tienes un cupón de acceso?</Label>
        <Input
          id="cupon-acceso"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          maxLength={40}
          className="w-48"
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending || code.trim().length < 3}>
        {pending && <Loader2Icon className="animate-spin" />}
        Canjear
      </Button>
    </form>
  );
}

/** Mientras se confirma un pago (webhook), refresca la página unas veces. */
export function PaymentProcessingRefresher({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      router.refresh();
      if (n >= 12) clearInterval(id);
    }, 5000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
