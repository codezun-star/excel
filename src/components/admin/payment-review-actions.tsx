"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { approveManualPayment, rejectManualPayment } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  "El monto no coincide",
  "No encontramos la transferencia con esa referencia",
  "El comprobante no se puede leer",
];

export function PaymentReviewActions({
  paymentId,
  reference,
  compact,
}: {
  paymentId: string;
  reference: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const approve = () => {
    if (!window.confirm(`¿Aprobar el pago ${reference}? Se activará el acceso del cliente.`))
      return;
    startTransition(async () => {
      const res = await approveManualPayment(paymentId);
      if (res.ok) {
        toast.success(`Pago ${reference} aprobado`);
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const reject = () => {
    startTransition(async () => {
      const res = await rejectManualPayment({ paymentId, reason });
      if (res.ok) {
        toast.success(`Pago ${reference} rechazado`);
        setOpen(false);
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <div className={compact ? "inline-flex gap-1" : "flex gap-2 md:flex-col"}>
      <Button size={compact ? "sm" : "default"} onClick={approve} disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
        Aprobar
      </Button>
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        <XIcon />
        Rechazar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar el pago {reference}</DialogTitle>
            <DialogDescription>El motivo se envía por correo al cliente.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setReason(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`motivo-${paymentId}`}>Motivo</Label>
            <Textarea
              id={`motivo-${paymentId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={reject}
              disabled={pending || reason.trim().length < 3}
            >
              Rechazar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
