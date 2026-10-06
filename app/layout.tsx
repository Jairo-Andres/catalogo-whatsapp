import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Atkinson_Hyperlegible_Mono, Overpass } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-atkinson",
  display: "swap",
});
const atkinsonMono = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson-mono",
  display: "swap",
  adjustFontFallback: false,
});
const overpass = Overpass({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-overpass",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} · Pedidos por WhatsApp`, template: `%s · ${SITE_NAME}` },
  description: `${SITE_TAGLINE}. Catálogo con link propio, sin pasarela de pagos y con estadísticas simples.`,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: { type: "website", locale: "es_CO", siteName: SITE_NAME },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${atkinson.variable} ${atkinsonMono.variable} ${overpass.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#contenido" className="sr-only-focusable ja-btn ja-btn--primary fixed left-2 top-2 z-50">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
