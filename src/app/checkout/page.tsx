import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutForm, type CheckoutSummary } from "@/components/checkout/checkout-form";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BILLING_DEFAULTS, formatHnl, formatUsd } from "@/config/plans";
import { DEFAULT_COUNTRY, getCountryContext, isCountryCode, type CountryCode } from "@/countries";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { getPlanCatalog } from "@/lib/billing/plans";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { listPriceUsd } from "@/payments/pricing";
import { providerOptions } from "@/payments/registry";
import { checkoutItemSchema } from "@/payments/schemas";
import type { CheckoutItem } from "@/payments/types";
import { getTemplateMeta } from "@/templates/catalog";

export const metadata: Metadata = { title: "Pagar | Excel Codezun", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseItem(sp: Record<string, string | string[] | undefined>): CheckoutItem | null {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const raw = one("plantilla")
    ? { kind: "template", templateSlug: one("plantilla") }
    : {
        kind: "plan",
        planCode: one("plan") ?? "pro",
        cycle: one("ciclo") === "anual" ? "yearly" : "monthly",
      };
  const parsed = checkoutItemSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page max-w-2xl py-12">
        <h1 className="text-3xl font-extrabold">Pagar</h1>
        <div className="mt-6">
          <NotConfiguredNotice />
        </div>
      </div>
    );
  }
  const query = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
  ).toString();
  const session = await getCurrentUser();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/checkout?${query}`)}`);

  const item = parseItem(sp);
  const catalog = await getPlanCatalog();
  const price = item ? listPriceUsd(catalog, item) : null;
  const meta = item?.kind === "template" ? getTemplateMeta(item.templateSlug) : undefined;
  const invalid =
    !item || price === null || (item.kind === "template" && (!meta || meta.tier !== "pro"));

  if (invalid) {
    return (
      <div className="container-page max-w-2xl py-12">
        <h1 className="text-3xl font-extrabold">Pagar</h1>
        <Alert variant="warning" className="mt-6">
          <AlertDescription>
            No encontramos esa opción.{" "}
            <Link href="/precios" className="underline">
              Ver planes
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data: profile } = await session.supabase
    .from("profiles")
    .select("country")
    .eq("id", session.user.id)
    .maybeSingle();
  const profileCountry = String(profile?.country ?? DEFAULT_COUNTRY);
  const country: CountryCode =
    isCountryCode(profileCountry) && getCountryContext(profileCountry)
      ? profileCountry
      : DEFAULT_COUNTRY;

  const entitlements = await getUserEntitlements(session.user.id);
  const plan = item.kind === "plan" ? catalog.plans.find((p) => p.code === item.planCode) : null;
  const summary: CheckoutSummary = {
    item,
    title:
      item.kind === "plan"
        ? `Plan ${plan?.name ?? item.planCode} · ${item.cycle === "yearly" ? "anual" : "mensual"}`
        : `Compra única: ${meta!.title}`,
    detail:
      item.kind === "plan"
        ? item.cycle === "yearly"
          ? `Un pago al año. Equivale a ${formatUsd(Math.round((price / 12) * 100) / 100)} al mes.`
          : "Se renueva cada mes. Cancela cuando quieras."
        : `Incluye ${catalog.oneTime.accessDays} días para corregir y volver a descargar.`,
    features: item.kind === "plan" ? (plan?.features ?? []) : [],
    priceUsd: price,
    exchangeRate: BILLING_DEFAULTS.exchangeRateUsdHnl,
    country,
  };
  const providers = providerOptions(country).filter((p) =>
    item.kind === "plan" ? p.subscriptions : p.oneTime,
  );
  const alreadyCovered =
    item.kind === "plan"
      ? entitlements.plan === item.planCode ||
        (entitlements.plan === "negocio" && item.planCode === "pro")
      : entitlements.limits.proTemplates;

  return (
    <div className="container-page max-w-4xl py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/precios" className="hover:underline">
          ← Volver a precios
        </Link>
      </nav>
      <h1 className="text-3xl font-extrabold">Completa tu compra</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Precio en dólares: {formatUsd(price)} (≈ {formatHnl(price)} de referencia).
      </p>
      {alreadyCovered && (
        <Alert variant="info" className="mt-6">
          <AlertDescription>
            Ya tienes acceso con tu plan {entitlements.planName}
            {entitlements.planValidUntil
              ? ` hasta el ${new Date(entitlements.planValidUntil).toLocaleDateString("es-HN", { dateStyle: "long" })}`
              : ""}
            . Si pagas de nuevo, el nuevo período se suma al final del actual (con transferencia).
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-8">
        {providers.length ? (
          <CheckoutForm summary={summary} providers={providers} />
        ) : (
          <Alert variant="warning">
            <AlertDescription>
              Los pagos en línea aún no están activos. Escríbenos a{" "}
              <a className="underline" href={`mailto:${SITE.contactEmail}`}>
                {SITE.contactEmail}
              </a>{" "}
              y te ayudamos a activar tu plan.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
