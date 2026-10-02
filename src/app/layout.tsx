import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.ogLocale,
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/", types: { "application/rss+xml": "/blog/rss.xml" } },
  // Señales geográficas: el mercado principal es Honduras.
  other: { "geo.region": "HN", "geo.placename": "Honduras", "content-language": "es-HN" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#217346" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1511" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-HN" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
