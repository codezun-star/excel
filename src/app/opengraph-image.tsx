import { OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = SITE.tagline;

export default function Image() {
  return renderOgImage({
    title: SITE.tagline,
    subtitle: "Facturas, planillas, impuestos, inventario y finanzas para Honduras.",
  });
}
