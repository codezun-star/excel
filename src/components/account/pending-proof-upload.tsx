"use client";

import { Loader2Icon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { uploadPaymentProof } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Subir el comprobante de un pago pendiente desde Mi suscripción. */
export function PendingProofUpload({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        fd.set("paymentId", paymentId);
        const res = await uploadPaymentProof(fd);
        setBusy(false);
        if (res.ok) {
          toast.success("Comprobante enviado");
          router.refresh();
        } else toast.error(res.error);
      }}
    >
      <Input
        name="file"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        required
        className="max-w-xs"
        aria-label="Archivo del comprobante"
      />
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
        Subir comprobante
      </Button>
    </form>
  );
}
