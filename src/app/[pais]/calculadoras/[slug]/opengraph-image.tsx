import { CALCULATORS, getCalculator } from "@/content/calculators";
import { activeCountries } from "@/countries";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Calculadora de Excel Codezun";

export function generateStaticParams() {
  return activeCountries().flatMap((ctx) =>
    CALCULATORS.map((c) => ({ pais: ctx.slug, slug: c.slug })),
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const calc = getCalculator((await params).slug);
  return renderOgImage({
    title: calc?.title ?? "Calculadoras para Honduras",
    subtitle: "Gratis · resultado al instante",
    badge: "Calculadora",
  });
}
