import { describe, expect, it } from "vitest";

import { CATEGORIES } from "./categories";
import { CATALOG, filterCatalog, getTemplateMeta } from "./catalog";
import { CLIENT_BUILDERS } from "./registry/client-builders";
import { FORM_LOADERS } from "./registry/forms";
import { SERVER_TEMPLATES } from "./registry/server";

/** Catálogo inicial solicitado: todas estas plantillas deben estar registradas. */
const REQUIRED_SLUGS =
  `factura-con-isv cotizacion-proforma recibo-de-pago nota-de-credito-debito cuentas-por-cobrar-pagar estado-de-cuenta-cliente reporte-de-ventas ventas-por-vendedor-comisiones caja-diaria-arqueo orden-de-compra libro-de-ventas-y-compras
declaracion-mensual-isv isr-personas-naturales control-de-retenciones impuesto-municipal calendario-tributario flujo-de-caja estado-de-resultados-balance libro-diario-mayor conciliacion-bancaria catalogo-de-cuentas activos-fijos-depreciacion presupuesto-anual punto-de-equilibrio
planilla-de-sueldos decimo-tercer-y-cuarto-mes prestaciones-laborales horas-extra salario-minimo control-de-vacaciones control-de-asistencia horarios-y-turnos boleta-de-pago evaluacion-de-desempeno prestamos-a-empleados comisiones-y-bonos
inventario-stock-minimo kardex inventario-por-lote-vencimiento lista-de-precios-margen control-de-fiados mercaderia-en-consignacion pedidos-y-entregas ventas-por-whatsapp costos-de-importacion-aduana
pulperia restaurante-costos-recetas taller-mecanico barberia-salon ferreteria farmacia transporte-taxis tienda-de-ropa cafeteria-panaderia servicios-freelancers constructora-presupuesto-de-obra agricultura-cafe-ganaderia camaroneras-pesca
pensiones-y-mensualidades notas-y-promedios asistencia-escolar horario-de-clases planificador-de-estudio pagos-de-academias
presupuesto-mensual gastos-e-ingresos deudas-y-tarjetas simulador-de-prestamos ahorro-por-metas control-de-remesas prestamo-de-vivienda comprar-vs-alquilar jubilacion pagos-de-servicios presupuesto-de-bodas-eventos lista-del-super
cuotas-patronato contabilidad-de-iglesias cajas-de-ahorro-cooperativas rifas-y-colectas aportes-asociaciones administracion-de-condominios
control-de-alquileres contrato-de-arrendamiento gastos-de-propiedades rentabilidad-inmobiliaria ventas-de-lotes-a-plazos
plan-de-negocio-12-meses costos-de-producto calendario-de-contenido campanas-y-resultados crm-simple metas-de-ventas plan-de-lanzamiento
citas-y-pacientes historial-de-consultas medicamentos-y-vencimientos seguimiento-de-salud planificador-de-comidas-y-rutinas`
    .split(/\s+/)
    .filter(Boolean);

describe("catálogo de plantillas", () => {
  it("registra todas las plantillas solicitadas", () => {
    const missing = REQUIRED_SLUGS.filter((slug) => !getTemplateMeta(slug));
    expect(missing).toEqual([]);
  });

  it("no tiene slugs duplicados y todos son URL seguros", () => {
    const slugs = CATALOG.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("usa categorías existentes y SEO completo", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const t of CATALOG) {
      expect(ids.has(t.category)).toBe(true);
      expect(t.seo.title.length).toBeGreaterThan(10);
      expect(t.seo.description.length).toBeGreaterThan(30);
    }
  });

  it("cada plantilla lista tiene formulario y build en el servidor", () => {
    for (const t of CATALOG.filter((x) => x.status === "ready")) {
      expect(FORM_LOADERS[t.slug], `formulario de ${t.slug}`).toBeTypeOf("function");
      expect(SERVER_TEMPLATES[t.slug], `build servidor de ${t.slug}`).toBeTypeOf("function");
    }
  });

  it("nunca envía al navegador el build de una plantilla Pro", () => {
    for (const slug of Object.keys(CLIENT_BUILDERS)) {
      const meta = getTemplateMeta(slug);
      expect(meta?.status, slug).toBe("ready");
      expect(meta?.tier, `${slug} no puede construirse en el navegador`).toBe("free");
    }
    // Y toda plantilla gratis lista se puede generar en el navegador
    for (const t of CATALOG.filter((x) => x.status === "ready" && x.tier === "free")) {
      expect(CLIENT_BUILDERS[t.slug], `build cliente de ${t.slug}`).toBeTypeOf("function");
    }
  });

  it("los registros no contienen slugs fuera del catálogo", () => {
    for (const slug of [...Object.keys(FORM_LOADERS), ...Object.keys(SERVER_TEMPLATES)]) {
      expect(getTemplateMeta(slug)?.status, slug).toBe("ready");
    }
  });

  it("busca sin distinguir acentos", () => {
    expect(
      filterCatalog({ query: "decimo" }).some((t) => t.slug === "decimo-tercer-y-cuarto-mes"),
    ).toBe(true);
    expect(filterCatalog({ query: "fáctura isv" }).map((t) => t.slug)).toContain("factura-con-isv");
  });
});
