/** Diccionario de textos de interfaz compartidos (español). */
export const es = {
  nav: {
    templates: "Plantillas",
    categories: "Categorías",
    pricing: "Precios",
    howItWorks: "Cómo funciona",
    account: "Mi cuenta",
    login: "Ingresar",
    signup: "Crear cuenta",
    logout: "Cerrar sesión",
    menu: "Menú",
  },
  badges: {
    free: "Gratis",
    pro: "Pro",
    soon: "Próximamente",
  },
  country: {
    label: "País",
    soon: "Próximamente",
  },
  theme: {
    toggle: "Cambiar tema",
  },
  workspace: {
    configure: "Configura tu plantilla",
    preview: "Vista previa",
    download: "Descargar .xlsx",
    downloading: "Generando…",
    save: "Guardar configuración",
    reset: "Restablecer",
    invalid: "Revisa los campos marcados en rojo para generar el archivo.",
    building: "Actualizando vista previa…",
    formulaHint: "Las celdas ƒx se calculan solas al abrir el archivo en Excel o Google Sheets.",
    loading: "Cargando plantilla…",
  },
  auth: {
    email: "Correo electrónico",
    password: "Contraseña",
    name: "Nombre completo",
    google: "Continuar con Google",
    notConfigured:
      "El inicio de sesión no está configurado en este entorno. Puedes generar y descargar plantillas sin cuenta.",
  },
  footer: {
    madeIn: "Hecho en Honduras para Latinoamérica",
  },
} as const;

export type Dictionary = typeof es;
