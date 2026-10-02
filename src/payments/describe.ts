import { getTemplateMeta } from "@/templates/catalog";

/** Descripción legible de un pago manual (para correos y paneles). */
export function describePayment(p: {
  kind: string;
  plan_code: string | null;
  billing_cycle: string | null;
  template_slug: string | null;
}): string {
  if (p.kind === "template") {
    const meta = p.template_slug ? getTemplateMeta(p.template_slug) : undefined;
    return `Compra única: ${meta?.title ?? p.template_slug}`;
  }
  const plan = p.plan_code === "negocio" ? "Plan Negocio / Contador" : "Plan Pro";
  return `${plan} ${p.billing_cycle === "yearly" ? "anual" : "mensual"}`;
}
