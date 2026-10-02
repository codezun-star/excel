import { OG_SIZE, renderOgImage } from "@/lib/og";
import { CATALOG, getTemplateMeta } from "@/templates/catalog";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Plantilla de Excel";

export function generateStaticParams() {
  return CATALOG.map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getTemplateMeta(slug);
  return renderOgImage({
    title: meta?.title ?? "Plantilla de Excel",
    subtitle: meta?.shortDescription ?? "",
    badge: meta
      ? meta.status === "coming-soon"
        ? "Próximamente"
        : meta.tier === "pro"
          ? "Pro"
          : "Gratis"
      : undefined,
  });
}
